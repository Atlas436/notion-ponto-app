import { formatDateBR, minutesToTime } from './time'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const SHEET_TAB = 'Cozy Ponto'

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

async function ensureSheetTab(spreadsheetId, accessToken) {
  const data = await sheetsFetch(`${spreadsheetId}?fields=sheets.properties`, accessToken)
  const exists = data.sheets?.some((s) => s.properties.title === SHEET_TAB)
  if (!exists) {
    await sheetsFetch(`${spreadsheetId}:batchUpdate`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] }),
    })
  }
}

export function buildSheetValues({ colaborador, monthName, ano, computedRows, totalMinutes, totalExtraMinutes }) {
  const header = ['Data', 'Dia', 'Entrada', 'Saída', 'Total Trabalhado', 'Horas Extras', 'Descrição / Atividades']
  const body = computedRows.map((row) => [
    formatDateBR(row.date),
    row.holidayName ? `${row.weekdayLabel} (${row.holidayName})` : row.weekdayLabel,
    row.entrada || '',
    row.saida || '',
    minutesToTime(row.totalMinutes),
    minutesToTime(row.extraMinutes),
    row.descricao || '',
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

export async function syncToGoogleSheet({ spreadsheetId, accessToken, ...reportData }) {
  await ensureSheetTab(spreadsheetId, accessToken)

  const values = buildSheetValues(reportData)
  const range = `${SHEET_TAB}!A1`

  // Limpa a aba antes de escrever, pra não sobrar lixo de um mês com mais linhas que o atual.
  await sheetsFetch(`${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, accessToken, { method: 'POST' })

  await sheetsFetch(
    `${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    },
  )
}
