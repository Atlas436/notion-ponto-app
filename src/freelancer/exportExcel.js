import * as XLSX from 'xlsx'

const money = (value) => Number(value || 0).toFixed(2).replace('.', ',')

export function exportFreelancerToExcel({ monthName, year, projects, entries, payments }) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const rows = entries.map((entry) => {
    const project = projectById.get(entry.projectId)
    const minutes = Number(entry.minutes || 0)
    const hours = minutes / 60
    const rate = project?.billingType === 'hour' ? Number(project?.rate || 0) : 0
    return [entry.date, project?.client || '', project?.name || 'Projeto removido', entry.start || '', entry.end || '', hours, entry.description || '', money(hours * rate)]
  })
  const projectsRows = projects.map((project) => {
    const hours = entries.filter((entry) => entry.projectId === project.id).reduce((total, entry) => total + Number(entry.minutes || 0), 0) / 60
    const billed = project.billingType === 'hour' ? hours * Number(project.rate || 0) : Number(project.rate || 0)
    const received = payments.filter((payment) => payment.projectId === project.id && payment.status === 'paid').reduce((total, payment) => total + Number(payment.amount || 0), 0)
    return [project.client || '', project.name, project.status, project.monthly ? 'Mensal' : 'Avulso', hours, money(billed), money(received), money(billed - received), project.deadline || '']
  })
  const workbook = XLSX.utils.book_new()
  const report = XLSX.utils.aoa_to_sheet([
    ['Cozy Freelancer — ' + monthName + ' / ' + year], [],
    ['Data', 'Cliente', 'Projeto', 'Início', 'Fim', 'Horas', 'Atividade', 'Valor por hora'],
    ...rows,
  ])
  report['!cols'] = [{ wch: 13 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 42 }, { wch: 16 }]
  const summary = XLSX.utils.aoa_to_sheet([
    ['Projetos e cobranças'], [],
    ['Cliente', 'Projeto', 'Status', 'Tipo', 'Horas', 'A cobrar', 'Recebido', 'Saldo', 'Prazo'],
    ...projectsRows,
  ])
  summary['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(workbook, report, 'Horas')
  XLSX.utils.book_append_sheet(workbook, summary, 'Projetos')
  XLSX.writeFile(workbook, ('Cozy_Freelancer_' + monthName + '_' + year + '.xlsx').replace(/\s+/g, '_'))
}