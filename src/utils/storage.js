import { DEFAULT_JORNADA } from './time'

const SETTINGS_KEY = 'cozyPonto.settings'
const monthKey = (year, month) => `cozyPonto.month.${year}-${String(month).padStart(2, '0')}`

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { colaborador: 'Julia', jornadaPadrao: DEFAULT_JORNADA }
    const parsed = JSON.parse(raw)
    return {
      colaborador: parsed.colaborador ?? 'Julia',
      jornadaPadrao: parsed.jornadaPadrao ?? DEFAULT_JORNADA,
    }
  } catch {
    return { colaborador: 'Julia', jornadaPadrao: DEFAULT_JORNADA }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // localStorage indisponível (modo privado, quota excedida, etc.) — ignora silenciosamente
  }
}

export function loadMonthRows(year, month) {
  try {
    const raw = localStorage.getItem(monthKey(year, month))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveMonthRows(year, month, rows) {
  try {
    localStorage.setItem(monthKey(year, month), JSON.stringify(rows))
  } catch {
    // localStorage indisponível — ignora silenciosamente
  }
}
