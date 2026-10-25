import { summarizeProjects } from './summary'
const SHEET_TAB = 'Cozy Freelancer'

async function request(path, accessToken, options = {}) {
  const response = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' + path,
    {
      ...options,
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(
      body?.error?.message || 'Não foi possível sincronizar o Freelancer.'
    )
  }
  return response.json()
}

async function ensureTab(spreadsheetId, accessToken) {
  const data = await request(
    spreadsheetId + '?fields=sheets.properties',
    accessToken
  )
  const current = data.sheets?.find(
    (sheet) => sheet.properties.title === SHEET_TAB
  )
  if (current) return current.properties
  const created = await request(spreadsheetId + ':batchUpdate', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: SHEET_TAB } } }],
    }),
  })
  return created.replies[0].addSheet.properties
}

const currency = (number) =>
  Number(number || 0)
    .toFixed(2)
    .replace('.', ',')

export async function syncFreelancerToGoogleSheet({
  spreadsheetId,
  accessToken,
  projects,
  entries,
  payments,
  monthName,
  year,
}) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const totals = summarizeProjects(projects, entries, payments).map(
    (project) => [
      project.client || '',
      project.name,
      project.status,
      project.monthly ? 'Mensal' : 'Avulso',
      project.allMinutes / 60,
      currency(project.billed),
      currency(project.received),
      currency(project.balance),
      project.deadline || '',
    ]
  )
  const entriesRows = entries.map((entry) => {
    const project = projectById.get(entry.projectId)
    return [
      entry.date,
      project?.client || '',
      project?.name || '',
      entry.start || '',
      entry.end || '',
      (Number(entry.minutes || 0) / 60).toFixed(2),
      entry.description || '',
    ]
  })
  const sheet = await ensureTab(spreadsheetId, accessToken)
  // Each table has a permanent position. Editing values never touches styles,
  // borders, widths, frozen rows or notes. Spacer columns J and R are user-owned.
  const blocks = [
    {
      startColumnIndex: 0,
      endColumnIndex: 9,
      values: [
        ['Cozy Freelancer — ' + monthName + ' / ' + year],
        ['Atualizado em ' + new Date().toLocaleString('pt-BR')],
        ['Projetos — horas e cobranças do mês (valor fechado integral)'],
        [
          'Cliente',
          'Projeto',
          'Status',
          'Tipo',
          'Horas',
          'Valor do trabalho',
          'Recebido nas cobranças do mês',
          'Diferença no período',
          'Prazo',
        ],
        ...totals,
      ],
    },
    {
      startColumnIndex: 10,
      endColumnIndex: 17,
      values: [
        ['APONTAMENTOS DE HORAS'],
        [],
        [],
        ['Data', 'Cliente', 'Projeto', 'Início', 'Fim', 'Horas', 'Atividade'],
        ...entriesRows,
      ],
    },
    {
      startColumnIndex: 18,
      endColumnIndex: 25,
      values: [
        ['COBRANÇAS COM VENCIMENTO NO MÊS'],
        [],
        [],
        [
          'Projeto',
          'Valor (R$)',
          'Vencimento',
          'Status',
          'Recebido em',
          'Meses trabalhados',
          'Horas do fechamento',
        ],
        ...payments.map((payment) => [
          projectById.get(payment.projectId)?.name || '',
          Number(payment.amount || 0),
          payment.dueDate || '',
          payment.status === 'paid' ? 'Recebido' : 'Pendente',
          payment.paidAt || '',
          (payment.months || []).join(', '),
          Number(payment.minutes || 0) / 60,
        ]),
      ],
    },
  ]
  const neededRows = Math.max(...blocks.map((block) => block.values.length))
  const requests = []
  if (neededRows > sheet.gridProperties.rowCount) {
    requests.push({
      appendDimension: {
        sheetId: sheet.sheetId,
        dimension: 'ROWS',
        length: neededRows - sheet.gridProperties.rowCount,
      },
    })
  }
  if (sheet.gridProperties.columnCount < 25) {
    requests.push({
      appendDimension: {
        sheetId: sheet.sheetId,
        dimension: 'COLUMNS',
        length: 25 - sheet.gridProperties.columnCount,
      },
    })
  }
  for (const block of blocks) {
    requests.push({
      updateCells: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: 0,
          startColumnIndex: block.startColumnIndex,
          endColumnIndex: block.endColumnIndex,
        },
        rows: block.values.map((row) => ({
          values: row.map((value) => ({
            userEnteredValue:
              typeof value === 'number'
                ? { numberValue: value }
                : { stringValue: String(value ?? '') },
          })),
        })),
        // The remainder of each owned range is cleared in the same atomic write.
        // Only userEnteredValue is affected, including when a new month has fewer rows.
        fields: 'userEnteredValue',
      },
    })
  }
  await request(spreadsheetId + ':batchUpdate', accessToken, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  })
}
