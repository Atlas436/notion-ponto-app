export const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const DEFAULT_ENTRADA = '17:30'
export const DEFAULT_SAIDA = '21:30'
export const DEFAULT_JORNADA = '04:00'

export function pad(n) {
  return String(n).padStart(2, '0')
}

export function isWeekend(dow) {
  return dow === 0 || dow === 6
}

export function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function formatDateBR(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function getWeekdayIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function parseTimeToMinutes(value) {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (Number.isNaN(h) || Number.isNaN(m) || m > 59) return null
  return h * 60 + m
}

export function minutesToTime(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return '00:00'
  const sign = totalMinutes < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${pad(h)}:${pad(m)}`
}

export function diffMinutes(entrada, saida) {
  const start = parseTimeToMinutes(entrada)
  const end = parseTimeToMinutes(saida)
  if (start == null || end == null) return 0
  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return diff
}

export function generateMonthRows(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const rows = []
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dow = new Date(year, month - 1, day).getDay()
    const weekend = isWeekend(dow)
    rows.push({
      date: dateKey(year, month, day),
      entrada: weekend ? '' : DEFAULT_ENTRADA,
      saida: weekend ? '' : DEFAULT_SAIDA,
      descricao: '',
    })
  }
  return rows
}

export function computeRow(row, jornadaPadraoMinutes) {
  const dow = getWeekdayIndex(row.date)
  const weekend = isWeekend(dow)
  const totalMinutes = diffMinutes(row.entrada, row.saida)
  const extraMinutes = weekend ? totalMinutes : Math.max(0, totalMinutes - jornadaPadraoMinutes)

  return {
    ...row,
    weekend,
    weekdayLabel: WEEKDAY_SHORT[dow],
    totalMinutes,
    extraMinutes,
  }
}
