import { formatDateBR, minutesToTime } from './time'
import { buildDescricaoCell } from './tasks'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const SHEET_TAB = 'Cozy Ponto'
const HEADER_COLUMNS = 7 // Data, Dia, Entrada, Saída, Total, Extras, Descrição
const MAX_FORMAT_ROWS = 400 // generoso o bastante pra qualquer mês + título/rodapé

let gisLoadPromise = null

function loadGis() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Disponível apenas no navegador.'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Não foi possível carregar o script de login do Google.'))
    document.head.appendChild(script)
  })
  return gisLoadPromise
}

// Abre a janela de login/permissão do Google e devolve um access token válido por ~1h.
// O token nunca é salvo em disco — fica só na memória da sessão (state do React).
export async function requestAccessToken(clientId) {
  if (!clientId) throw new Error('Preencha o Client ID do Google antes de conectar.')
  await loadGis()

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SHEETS_SCOPE,
      callback: (response) => {
        if (response.error) reject(new Error(response.error_description || response.error))
        else resolve(response.access_token)
      },
      error_callback: (err) => reject(new Error(err?.message || 'Login com o Google cancelado ou falhou.')),
    })
    tokenClient.requestAccessToken()
  })
}

// Aceita tanto o link completo da planilha quanto só o ID.
export function extractSpreadsheetId(input) {
  if (!input) return ''
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : input.trim()
}

async function sheetsFetch(path, accessToken, options = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.error?.message
    if (res.status === 401) throw new Error('Sua sessão do Google expirou. Clique em "Conectar com Google" de novo.')
    if (res.status === 403) throw new Error('Sem permissão de edição nessa planilha. Confira o compartilhamento no Google Sheets.')
    if (res.status === 404) throw new Error('Planilha não encontrada. Confira o link/ID.')
    throw new Error(message || 'Falha ao falar com o Google Sheets.')
  }
  return res.json()
}

// Garante que a aba "Cozy Ponto" existe e devolve o sheetId dela (necessário pra formatação).
async function ensureSheetTab(spreadsheetId, accessToken) {
  const data = await sheetsFetch(`${spreadsheetId}?fields=sheets.properties`, accessToken)
  const existing = data.sheets?.find((s) => s.properties.title === SHEET_TAB)
  if (existing) return existing.properties.sheetId

  const created = await sheetsFetch(`${spreadsheetId}:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] }),
  })
  return created.replies[0].addSheet.properties.sheetId
}

export function buildSheetValues({ colaborador, monthName, ano, computedRows, totalMinutes, totalExtraMinutes, taskTags = [] }) {
  const header = ['Data', 'Dia', 'Entrada', 'Saída', 'Total Trabalhado', 'Horas Extras', 'Descrição / Atividades']
  const body = computedRows.map((row) => [
    formatDateBR(row.date),
    row.holidayName ? `${row.weekdayLabel} (${row.holidayName})` : row.weekdayLabel,
    row.entrada || '',
    row.saida || '',
    minutesToTime(row.totalMinutes),
    minutesToTime(row.extraMinutes),
    buildDescricaoCell(row, taskTags),
  ])
  const footer = ['', '', '', 'Total do Mês', minutesToTime(totalMinutes), minutesToTime(totalExtraMinutes), '']

  return [
    [`Relatório de Ponto — ${colaborador}`],
    [`${monthName} / ${ano} · atualizado em ${new Date().toLocaleString('pt-BR')}`],
    [],
    header,
    ...body,
    [],
    footer,
  ]
}

function hexToColor(hex) {
  const clean = hex.replace('#', '')
  return {
    red: parseInt(clean.substring(0, 2), 16) / 255,
    green: parseInt(clean.substring(2, 4), 16) / 255,
    blue: parseInt(clean.substring(4, 6), 16) / 255,
  }
}

// Mesma paleta cozy pastel do app (tailwind.config.js), convertida pro formato de cor do Sheets.
const COLORS = {
  text: hexToColor('#453C4E'),
  muted: hexToColor('#8C8296'),
  headerBg: hexToColor('#EDE7F6'),
  extra: hexToColor('#B85C3F'),
  weekendBg: hexToColor('#EFF3E9'),
  holidayBg: hexToColor('#FBEAF2'),
}

// Monta as requisições de formatação (cores, negrito, colunas, congelar cabeçalho) pra ficar
// parecido com o visual do app. Sempre começa resetando o range inteiro, pra não sobrar
// formatação de um mês anterior com mais linhas que o atual.
export function buildFormattingRequests(sheetId, computedRows) {
  const headerRowIndex = 3
  const firstDataRowIndex = 4
  const footerRowIndex = firstDataRowIndex + computedRows.length + 1

  const requests = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: MAX_FORMAT_ROWS, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
        cell: { userEnteredFormat: {} },
        fields: 'userEnteredFormat',
      },
    },
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: firstDataRowIndex } },
        fields: 'gridProperties.frozenRowCount',
      },
    },
    ...[
      { col: 0, width: 100 },
      { col: 1, width: 90 },
      { col: 2, width: 70 },
      { col: 3, width: 70 },
      { col: 4, width: 130 },
      { col: 5, width: 110 },
      { col: 6, width: 320 },
    ].map(({ col, width }) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: col, endIndex: col + 1 },
        properties: { pixelSize: width },
        fields: 'pixelSize',
      },
    })),
    { mergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS }, mergeType: 'MERGE_ALL' } },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14, foregroundColor: COLORS.text } } },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
        cell: { userEnteredFormat: { textFormat: { italic: true, foregroundColor: COLORS.muted } } },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: headerRowIndex, endRowIndex: headerRowIndex + 1, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
        cell: { userEnteredFormat: { backgroundColor: COLORS.headerBg, textFormat: { bold: true, foregroundColor: COLORS.text } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: footerRowIndex, endRowIndex: footerRowIndex + 1, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
        cell: { userEnteredFormat: { backgroundColor: COLORS.headerBg, textFormat: { bold: true, foregroundColor: COLORS.text } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
  ]

  computedRows.forEach((row, i) => {
    const rowIndex = firstDataRowIndex + i
    const backgroundColor = row.holidayName ? COLORS.holidayBg : row.weekend ? COLORS.weekendBg : null
    if (backgroundColor) {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: HEADER_COLUMNS },
          cell: { userEnteredFormat: { backgroundColor } },
          fields: 'userEnteredFormat.backgroundColor',
        },
      })
    }
    if (row.extraMinutes > 0) {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 5, endColumnIndex: 6 },
          cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: COLORS.extra } } },
          fields: 'userEnteredFormat.textFormat',
        },
      })
    }
  })

  return requests
}

export async function syncToGoogleSheet({ spreadsheetId, accessToken, ...reportData }) {
  const sheetId = await ensureSheetTab(spreadsheetId, accessToken)

  const values = buildSheetValues(reportData)

  // Limpa a aba inteira antes de escrever, pra não sobrar lixo de um mês com mais linhas que o atual.
  await sheetsFetch(`${spreadsheetId}/values/${encodeURIComponent(SHEET_TAB)}:clear`, accessToken, { method: 'POST' })

  const writeRange = `${SHEET_TAB}!A1`
  // RAW (não USER_ENTERED): queremos nossos textos ("17:30", "04:00", "02/03/2026") escritos
  // literalmente. Com USER_ENTERED o Sheets "adivinha" que são hora/data e troca pelo número
  // serial dele por baixo (ex.: "17:30" virava 0,7291666667), estourando a formatação.
  await sheetsFetch(
    `${spreadsheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=RAW`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ range: writeRange, majorDimension: 'ROWS', values }),
    },
  )

  await sheetsFetch(`${spreadsheetId}:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ requests: buildFormattingRequests(sheetId, reportData.computedRows) }),
  })
}
