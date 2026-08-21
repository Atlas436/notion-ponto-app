import { Calendar, CalendarHeart, Clock, Download, FileSpreadsheet, Printer, RefreshCw, Sparkles, User } from 'lucide-react'
import { getDailyMessage } from '../utils/dailyMessage'
import { MONTH_NAMES } from '../utils/time'

const dailyMessage = getDailyMessage()

export default function Header({
  colaborador,
  onColaboradorChange,
  mes,
  onMesChange,
  ano,
  onAnoChange,
  jornadaPadrao,
  onJornadaPadraoChange,
  showHolidays,
  onToggleHolidays,
  showGoogleSheets,
  onToggleGoogleSheets,
  onGenerateReset,
  onExportExcel,
  onExportPdf,
}) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-cozy-border bg-cozy-bg/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-2xl">
          <span aria-hidden="true">🕰️</span>
          <h1 className="font-semibold tracking-tight text-cozy-text">Cozy Ponto</h1>
        </div>
        <p className="mt-1 text-sm text-cozy-muted">
          Controle de ponto minimalista para registro de jornada, tarefas diárias e cálculo de horas extras.
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs italic text-cozy-accent/80">
          <Sparkles size={12} className="shrink-0" aria-hidden="true" />
          {dailyMessage}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs font-medium text-cozy-muted">
              <User size={13} /> Colaborador(a)
            </span>
            <input
              type="text"
              value={colaborador}
              onChange={(e) => onColaboradorChange(e.target.value)}
              className="w-44 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
              placeholder="Nome do colaborador"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs font-medium text-cozy-muted">
              <Calendar size={13} /> Mês
            </span>
            <select
              value={mes}
              onChange={(e) => onMesChange(Number(e.target.value))}
              className="rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-cozy-muted">Ano</span>
            <input
              type="number"
              value={ano}
              onChange={(e) => onAnoChange(Number(e.target.value))}
              className="w-24 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs font-medium text-cozy-muted">
              <Clock size={13} /> Jornada padrão
            </span>
            <input
              type="time"
              value={jornadaPadrao}
              onChange={(e) => onJornadaPadraoChange(e.target.value)}
              className="w-36 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
            />
          </label>

          <button
            type="button"
            onClick={onGenerateReset}
            className="flex items-center gap-1.5 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
          >
            <RefreshCw size={14} /> Gerar / Resetar Mês
          </button>

          <button
            type="button"
            onClick={onToggleHolidays}
            aria-pressed={showHolidays}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              showHolidays
                ? 'border-cozy-holiday bg-cozy-holidayBg text-cozy-holiday'
                : 'border-cozy-border bg-cozy-panel text-cozy-text hover:bg-cozy-weekend'
            }`}
          >
            <CalendarHeart size={14} /> Feriados
          </button>

          <button
            type="button"
            onClick={onToggleGoogleSheets}
            aria-pressed={showGoogleSheets}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              showGoogleSheets
                ? 'border-cozy-accent bg-cozy-accent/10 text-cozy-accent'
                : 'border-cozy-border bg-cozy-panel text-cozy-text hover:bg-cozy-weekend'
            }`}
          >
            <FileSpreadsheet size={14} /> Google Sheets
          </button>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-cozy-sage px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110"
            >
              <Download size={14} /> Exportar Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="flex items-center gap-1.5 rounded-xl bg-cozy-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110"
            >
              <Printer size={14} /> Exportar PDF / Imprimir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
