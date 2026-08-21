import { DEFAULT_JORNADA } from './time'

const SETTINGS_KEY = 'cozyPonto.settings'
const monthKey = (year, month) => `cozyPonto.month.${year}-${String(month).padStart(2, '0')}`
const holidaysKey = (year) => `cozyPonto.holidays.${year}`
const RECURRING_HOLIDAYS_KEY = 'cozyPonto.recurringHolidays'
const GOOGLE_SHEETS_KEY = 'cozyPonto.googleSheets'

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

export function loadHolidays(year) {
  try {
    const raw = localStorage.getItem(holidaysKey(year))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveHolidays(year, holidays) {
  try {
    localStorage.setItem(holidaysKey(year), JSON.stringify(holidays))
  } catch {
    // localStorage indisponível — ignora silenciosamente
  }
}

// Feriados/datas pessoais adicionados pelo usuário que se repetem todo ano (ex.: aniversário).
// Ficam guardados por dia/mês, independentes do ano — não em cozyPonto.holidays.{year}.
export function loadRecurringHolidays() {
  try {
    const raw = localStorage.getItem(RECURRING_HOLIDAYS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecurringHolidays(holidays) {
  try {
    localStorage.setItem(RECURRING_HOLIDAYS_KEY, JSON.stringify(holidays))
  } catch {
    // localStorage indisponível — ignora silenciosamente
  }
}

// Configuração de sincronização com Google Sheets (Client ID e link/ID da planilha).
// Não guarda o token de acesso — esse fica só em memória, nunca persiste.
export function loadGoogleSheetsSettings() {
  try {
    const raw = localStorage.getItem(GOOGLE_SHEETS_KEY)
    if (!raw) return { clientId: '', spreadsheetLink: '', autoSync: false }
    const parsed = JSON.parse(raw)
    return {
      clientId: parsed.clientId ?? '',
      spreadsheetLink: parsed.spreadsheetLink ?? '',
      autoSync: Boolean(parsed.autoSync),
    }
  } catch {
    return { clientId: '', spreadsheetLink: '', autoSync: false }
  }
}

export function saveGoogleSheetsSettings(settings) {
  try {
    localStorage.setItem(GOOGLE_SHEETS_KEY, JSON.stringify(settings))
  } catch {
    // localStorage indisponível — ignora silenciosamente
  }
}
