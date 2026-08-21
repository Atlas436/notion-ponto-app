import { dateKey } from './time'

// Calcula o Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
export function computeEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDateKey(date) {
  return dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// Feriados nacionais de data fixa.
const NATIONAL_FIXED = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 11, day: 20, name: 'Consciência Negra' },
  { month: 12, day: 25, name: 'Natal' },
]

// Feriados estaduais de São Paulo, de data fixa.
const SP_STATE_FIXED = [{ month: 7, day: 9, name: 'Revolução Constitucionalista de 1932' }]

export function getMovableNationalHolidays(year) {
  const easter = computeEaster(year)
  return [
    { date: toDateKey(addDays(easter, -48)), name: 'Carnaval (segunda-feira)' },
    { date: toDateKey(addDays(easter, -47)), name: 'Carnaval (terça-feira)' },
    { date: toDateKey(addDays(easter, -2)), name: 'Sexta-feira Santa' },
    { date: toDateKey(addDays(easter, 60)), name: 'Corpus Christi' },
  ]
}

// Feriados nacionais + estaduais (SP) para o ano informado, todos habilitados por padrão.
// O usuário pode desligar/remover ou adicionar feriados municipais/personalizados na UI.
export function getDefaultHolidays(year) {
  const fixed = [
    ...NATIONAL_FIXED.map((h) => ({ date: dateKey(year, h.month, h.day), name: h.name, scope: 'nacional' })),
    ...SP_STATE_FIXED.map((h) => ({ date: dateKey(year, h.month, h.day), name: h.name, scope: 'estadual (SP)' })),
  ]
  const movable = getMovableNationalHolidays(year).map((h) => ({ ...h, scope: 'nacional' }))

  return [...fixed, ...movable].map((h) => ({ ...h, enabled: true, custom: false })).sort((a, b) => (a.date > b.date ? 1 : -1))
}

// Projeta feriados/datas pessoais recorrentes (guardados só como dia/mês, ex.: aniversário)
// sobre um ano específico, pra exibir junto com os feriados daquele ano.
export function projectRecurringHolidays(recurringHolidays, year) {
  return recurringHolidays.map((r) => ({
    date: dateKey(year, r.month, r.day),
    name: r.name,
    scope: 'pessoal (todo ano)',
    enabled: r.enabled,
    custom: true,
    recurring: true,
    id: r.id,
  }))
}
