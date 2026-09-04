import * as XLSX from 'xlsx'
import { formatDateBR, minutesToTime } from './time'
import { buildDescricaoCell } from './tasks'

export function exportToExcel({ colaborador, monthName, year, computedRows, totalMinutes, totalExtraMinutes }) {
  const header = ['Data', 'Dia da Semana', 'Entrada', 'Saída', 'Total Trabalhado', 'Horas Extras', 'Descrição / Atividades']

  const body = computedRows.map((row) => [
    formatDateBR(row.date),
    row.holidayName ? `${row.weekdayLabel} (${row.holidayName})` : row.weekdayLabel,
    row.entrada || '',
    row.saida || '',
    minutesToTime(row.totalMinutes),
    minutesToTime(row.extraMinutes),
    buildDescricaoCell(row),
  ])

  const footer = ['', '', '', 'Total do Mês', minutesToTime(totalMinutes), minutesToTime(totalExtraMinutes), '']

  const sheetData = [
    [`Relatório de Ponto — ${colaborador}`],
    [`${monthName} / ${year}`],
    [],
    header,
    ...body,
    [],
    footer,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 40 },
  ]
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ponto')
  XLSX.writeFile(workbook, `Ponto_${colaborador}_${monthName}_${year}.xlsx`.replace(/\s+/g, '_'))
}
