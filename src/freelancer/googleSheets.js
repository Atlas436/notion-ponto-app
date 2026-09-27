const SHEET_TAB = 'Cozy Freelancer'

async function request(path, accessToken, options = {}) {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + path, {
    ...options,
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message || 'Não foi possível sincronizar o Freelancer.')
  }
  return response.json()
}

async function ensureTab(spreadsheetId, accessToken) {
  const data = await request(spreadsheetId + '?fields=sheets.properties', accessToken)
  const current = data.sheets?.find((sheet) => sheet.properties.title === SHEET_TAB)
  if (current) return current.properties.sheetId
  const created = await request(spreadsheetId + ':batchUpdate', accessToken, {
    method: 'POST',
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] }),
  })
  return created.replies[0].addSheet.properties.sheetId
}

const currency = (number) => Number(number || 0).toFixed(2).replace('.', ',')

export async function syncFreelancerToGoogleSheet({ spreadsheetId, accessToken, projects, entries, payments, monthName, year }) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const totals = projects.map((project) => {
    const minutes = entries.filter((entry) => entry.projectId === project.id).reduce((sum, entry) => sum + Number(entry.minutes || 0), 0)
    const hours = minutes / 60
    const billed = project.billingType === 'hour' ? hours * Number(project.rate || 0) : Number(project.rate || 0)
    const received = payments.filter((payment) => payment.projectId === project.id && payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    return [project.client || '', project.name, project.status, project.monthly ? 'Mensal' : 'Avulso', hours.toFixed(2), currency(billed), currency(received), currency(billed - received), project.deadline || '']
  })
  const entriesRows = entries.map((entry) => {
    const project = projectById.get(entry.projectId)
    return [entry.date, project?.client || '', project?.name || '', entry.start || '', entry.end || '', (Number(entry.minutes || 0) / 60).toFixed(2), entry.description || '']
  })
  await ensureTab(spreadsheetId, accessToken)
  const values = [
    ['Cozy Freelancer — ' + monthName + ' / ' + year],
    ['Atualizado em ' + new Date().toLocaleString('pt-BR')],
    [],
    ['PROJETOS E FINANCEIRO'],
    ['Cliente', 'Projeto', 'Status', 'Tipo', 'Horas', 'A cobrar', 'Recebido', 'Saldo', 'Prazo'],
    ...totals,
    [],
    ['APONTAMENTOS DE HORAS'],
    ['Data', 'Cliente', 'Projeto', 'Início', 'Fim', 'Horas', 'Atividade'],
    ...entriesRows,
  ]
  await request(spreadsheetId + '/values/' + encodeURIComponent(SHEET_TAB) + ':clear', accessToken, { method: 'POST' })
  await request(spreadsheetId + '/values/' + encodeURIComponent(SHEET_TAB + '!A1') + '?valueInputOption=RAW', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ range: SHEET_TAB + '!A1', majorDimension: 'ROWS', values }),
  })
}