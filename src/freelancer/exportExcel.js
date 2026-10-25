import { summarizeProjects } from './summary'
import * as XLSX from 'xlsx'

const money = (value) =>
  Number(value || 0)
    .toFixed(2)
    .replace('.', ',')

export function exportFreelancerToExcel({
  monthName,
  year,
  projects,
  entries,
  payments,
}) {
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const rows = entries.map((entry) => {
    const project = projectById.get(entry.projectId)
    const minutes = Number(entry.minutes || 0)
    const hours = minutes / 60
    const rate =
      project?.billingType === 'hour' ? Number(project?.rate || 0) : 0
    return [
      entry.date,
      project?.client || '',
      project?.name || 'Projeto removido',
      entry.start || '',
      entry.end || '',
      hours,
      entry.description || '',
      money(hours * rate),
    ]
  })
  const projectsRows = summarizeProjects(projects, entries, payments).map(
    (project) => [
      project.client || '',
      project.name,
      project.status,
      project.monthly ? 'Mensal' : 'Avulso',
      project.allMinutes / 60,
      money(project.billed),
      money(project.received),
      money(project.balance),
      project.deadline || '',
    ]
  )
  const workbook = XLSX.utils.book_new()
  const report = XLSX.utils.aoa_to_sheet([
    ['Cozy Freelancer — ' + monthName + ' / ' + year],
    [],
    [
      'Data',
      'Cliente',
      'Projeto',
      'Início',
      'Fim',
      'Horas',
      'Atividade',
      'Valor das horas (R$)',
    ],
    ...rows,
  ])
  report['!cols'] = [
    { wch: 13 },
    { wch: 22 },
    { wch: 28 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 42 },
    { wch: 16 },
  ]
  const summary = XLSX.utils.aoa_to_sheet([
    ['Projetos — horas e cobranças do mês (valor fechado integral)'],
    [],
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
    ...projectsRows,
  ])
  summary['!cols'] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ]
  const billing = XLSX.utils.aoa_to_sheet([
    ['Cobranças com vencimento no mês'],
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
  ])
  billing['!cols'] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 22 },
  ]
  XLSX.utils.book_append_sheet(workbook, billing, 'Cobranças')
  XLSX.utils.book_append_sheet(workbook, report, 'Horas')
  XLSX.utils.book_append_sheet(workbook, summary, 'Projetos')
  XLSX.writeFile(
    workbook,
    ('Cozy_Freelancer_' + monthName + '_' + year + '.xlsx').replace(/\s+/g, '_')
  )
}
