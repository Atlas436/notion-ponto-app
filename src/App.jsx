import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import HolidaysPanel from './components/HolidaysPanel'
import GoogleSheetsPanel from './components/GoogleSheetsPanel'
import PontoTable from './components/PontoTable'
import {
  loadSettings,
  saveSettings,
  loadMonthRows,
  saveMonthRows,
  loadHolidays,
  saveHolidays,
  loadRecurringHolidays,
  saveRecurringHolidays,
  loadGoogleSheetsSettings,
  saveGoogleSheetsSettings,
} from './utils/storage'
import { getDefaultHolidays, projectRecurringHolidays } from './utils/holidays'
import { computeRow, generateMonthRows, MONTH_NAMES, parseTimeToMinutes } from './utils/time'
import { exportToExcel } from './utils/exportExcel'
import { extractSpreadsheetId, requestAccessToken, syncToGoogleSheet } from './utils/googleSheets'

const today = new Date()
const initialSettings = loadSettings()

function activeDatesOf(displayHolidays) {
  return new Set(displayHolidays.filter((h) => h.enabled).map((h) => h.date))
}

export default function App() {
  const [colaborador, setColaborador] = useState(initialSettings.colaborador)
  const [jornadaPadrao, setJornadaPadrao] = useState(initialSettings.jornadaPadrao)
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [ano, setAno] = useState(today.getFullYear())
  // Feriados nacionais/estaduais + personalizados de um-ano-só, guardados por ano.
  const [holidays, setHolidays] = useState(() => loadHolidays(today.getFullYear()) ?? getDefaultHolidays(today.getFullYear()))
  // Datas pessoais que se repetem todo ano (ex.: aniversário) — guardadas só por dia/mês.
  const [recurringHolidays, setRecurringHolidays] = useState(() => loadRecurringHolidays())
  const [showHolidays, setShowHolidays] = useState(false)

  const initialSheetsSettings = useMemo(() => loadGoogleSheetsSettings(), [])
  const [sheetsClientId, setSheetsClientId] = useState(initialSheetsSettings.clientId)
  const [sheetsLink, setSheetsLink] = useState(initialSheetsSettings.spreadsheetLink)
  const [sheetsAutoSync, setSheetsAutoSync] = useState(initialSheetsSettings.autoSync)
  const [sheetsAccessToken, setSheetsAccessToken] = useState(null)
  const [sheetsStatus, setSheetsStatus] = useState('idle') // idle | connecting | syncing | success | error
  const [sheetsError, setSheetsError] = useState('')
  const [sheetsLastSyncedAt, setSheetsLastSyncedAt] = useState(null)
  const [showGoogleSheets, setShowGoogleSheets] = useState(false)

  // Lista exibida/usada nos cálculos: feriados do ano + recorrentes projetados sobre o ano.
  const displayHolidays = useMemo(() => {
    const combined = [...holidays, ...projectRecurringHolidays(recurringHolidays, ano)]
    return combined.sort((a, b) => (a.date > b.date ? 1 : -1))
  }, [holidays, recurringHolidays, ano])

  const [rows, setRows] = useState(() => loadMonthRows(ano, mes) ?? generateMonthRows(ano, mes, activeDatesOf(displayHolidays)))

  const reportRef = useRef(null)

  useEffect(() => {
    saveSettings({ colaborador, jornadaPadrao })
  }, [colaborador, jornadaPadrao])

  useEffect(() => {
    saveGoogleSheetsSettings({ clientId: sheetsClientId, spreadsheetLink: sheetsLink, autoSync: sheetsAutoSync })
  }, [sheetsClientId, sheetsLink, sheetsAutoSync])

  useEffect(() => {
    // Resolve os feriados do ano primeiro (síncrono, sem depender do state antigo) para
    // que a geração do mês abaixo já saiba quais dias são não-trabalhados.
    const resolvedHolidays = loadHolidays(ano) ?? getDefaultHolidays(ano)
    setHolidays(resolvedHolidays)
    const resolvedDisplay = [...resolvedHolidays, ...projectRecurringHolidays(recurringHolidays, ano)]

    const saved = loadMonthRows(ano, mes)
    if (saved) {
      setRows(saved)
    } else {
      const generated = generateMonthRows(ano, mes, activeDatesOf(resolvedDisplay))
      setRows(generated)
      saveMonthRows(ano, mes, generated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes])

  const jornadaPadraoMinutes = useMemo(() => parseTimeToMinutes(jornadaPadrao) ?? 240, [jornadaPadrao])

  const holidayNames = useMemo(
    () => new Map(displayHolidays.filter((h) => h.enabled).map((h) => [h.date, h.name])),
    [displayHolidays],
  )

  const computedRows = useMemo(
    () => rows.map((row) => computeRow(row, jornadaPadraoMinutes, holidayNames)),
    [rows, jornadaPadraoMinutes, holidayNames],
  )

  const totalMinutes = useMemo(() => computedRows.reduce((acc, row) => acc + row.totalMinutes, 0), [computedRows])
  const totalExtraMinutes = useMemo(() => computedRows.reduce((acc, row) => acc + row.extraMinutes, 0), [computedRows])

  function updateRow(date, field, value) {
    setRows((prev) => {
      const next = prev.map((row) => (row.date === date ? { ...row, [field]: value } : row))
      saveMonthRows(ano, mes, next)
      return next
    })
  }

  function handleGenerateReset() {
    const hasData = rows.some((row) => row.descricao || row.entrada !== '' || row.saida !== '')
    if (hasData) {
      const confirmed = window.confirm(
        `Isso irá substituir todos os registros de ${MONTH_NAMES[mes - 1]}/${ano} pelos valores padrão. Deseja continuar?`,
      )
      if (!confirmed) return
    }
    const generated = generateMonthRows(ano, mes, activeDatesOf(displayHolidays))
    setRows(generated)
    saveMonthRows(ano, mes, generated)
  }

  function updateHolidays(next) {
    setHolidays(next)
    saveHolidays(ano, next)
  }

  function updateRecurringHolidays(next) {
    setRecurringHolidays(next)
    saveRecurringHolidays(next)
  }

  function toggleHoliday(holiday) {
    if (holiday.recurring) {
      updateRecurringHolidays(recurringHolidays.map((r) => (r.id === holiday.id ? { ...r, enabled: !r.enabled } : r)))
    } else {
      updateHolidays(holidays.map((h) => (h.date === holiday.date ? { ...h, enabled: !h.enabled } : h)))
    }
  }

  function removeHoliday(holiday) {
    if (holiday.recurring) {
      updateRecurringHolidays(recurringHolidays.filter((r) => r.id !== holiday.id))
    } else {
      updateHolidays(holidays.filter((h) => h.date !== holiday.date))
    }
  }

  function addHoliday({ date, name, recurring }) {
    if (recurring) {
      const [, month, day] = date.split('-').map(Number)
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${month}-${day}-${Date.now()}`
      const exists = recurringHolidays.some((r) => r.month === month && r.day === day)
      if (exists) {
        updateRecurringHolidays(
          recurringHolidays.map((r) => (r.month === month && r.day === day ? { ...r, name, enabled: true } : r)),
        )
        return
      }
      updateRecurringHolidays([...recurringHolidays, { id, month, day, name, enabled: true }])
      return
    }

    const exists = holidays.some((h) => h.date === date)
    if (exists) {
      updateHolidays(holidays.map((h) => (h.date === date ? { ...h, name, enabled: true } : h)))
      return
    }
    const next = [...holidays, { date, name, scope: 'personalizado (só este ano)', enabled: true, custom: true }].sort(
      (a, b) => (a.date > b.date ? 1 : -1),
    )
    updateHolidays(next)
  }

  function handleExportExcel() {
    exportToExcel({
      colaborador: colaborador || 'Colaborador',
      monthName: MONTH_NAMES[mes - 1],
      year: ano,
      computedRows,
      totalMinutes,
      totalExtraMinutes,
    })
  }

  async function handleExportPdf() {
    const element = reportRef.current
    if (!element) return
    const html2pdf = (await import('html2pdf.js')).default
    html2pdf()
      .set({
        margin: 10,
        filename: `Ponto_${colaborador || 'Colaborador'}_${MONTH_NAMES[mes - 1]}_${ano}.pdf`.replace(/\s+/g, '_'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      })
      .from(element)
      .save()
  }

  async function syncNow(token) {
    const spreadsheetId = extractSpreadsheetId(sheetsLink)
    if (!spreadsheetId) {
      setSheetsStatus('error')
      setSheetsError('Cole o link ou o ID da planilha antes de sincronizar.')
      return
    }
    setSheetsStatus('syncing')
    try {
      await syncToGoogleSheet({
        spreadsheetId,
        accessToken: token,
        colaborador: colaborador || 'Colaborador',
        monthName: MONTH_NAMES[mes - 1],
        ano,
        computedRows,
        totalMinutes,
        totalExtraMinutes,
      })
      setSheetsStatus('success')
      setSheetsError('')
      setSheetsLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setSheetsStatus('error')
      setSheetsError(err.message)
    }
  }

  async function handleConnectGoogle() {
    setSheetsStatus('connecting')
    setSheetsError('')
    try {
      const token = await requestAccessToken(sheetsClientId)
      setSheetsAccessToken(token)
      await syncNow(token)
    } catch (err) {
      setSheetsStatus('error')
      setSheetsError(err.message)
    }
  }

  function handleSyncNow() {
    if (!sheetsAccessToken) return
    syncNow(sheetsAccessToken)
  }

  // Sincronização automática: espera 2s sem novas edições antes de mandar pro Google Sheets,
  // pra não estourar a cota da API a cada tecla digitada.
  useEffect(() => {
    if (!sheetsAutoSync || !sheetsAccessToken) return
    const timeout = setTimeout(() => {
      syncNow(sheetsAccessToken)
    }, 2000)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedRows, totalMinutes, totalExtraMinutes, sheetsAutoSync, sheetsAccessToken])

  return (
    <div className="min-h-screen bg-cozy-bg pb-16">
      <Header
        colaborador={colaborador}
        onColaboradorChange={setColaborador}
        mes={mes}
        onMesChange={setMes}
        ano={ano}
        onAnoChange={setAno}
        jornadaPadrao={jornadaPadrao}
        onJornadaPadraoChange={setJornadaPadrao}
        showHolidays={showHolidays}
        onToggleHolidays={() => setShowHolidays((v) => !v)}
        showGoogleSheets={showGoogleSheets}
        onToggleGoogleSheets={() => setShowGoogleSheets((v) => !v)}
        onGenerateReset={handleGenerateReset}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {showHolidays && (
          <HolidaysPanel
            ano={ano}
            holidays={displayHolidays}
            onToggle={toggleHoliday}
            onRemove={removeHoliday}
            onAdd={addHoliday}
          />
        )}

        {showGoogleSheets && (
          <GoogleSheetsPanel
            clientId={sheetsClientId}
            onClientIdChange={setSheetsClientId}
            spreadsheetLink={sheetsLink}
            onSpreadsheetLinkChange={setSheetsLink}
            autoSync={sheetsAutoSync}
            onAutoSyncChange={setSheetsAutoSync}
            connected={Boolean(sheetsAccessToken)}
            status={sheetsStatus}
            lastSyncedAt={sheetsLastSyncedAt}
            errorMessage={sheetsError}
            onConnect={handleConnectGoogle}
            onSyncNow={handleSyncNow}
          />
        )}

        <PontoTable
          ref={reportRef}
          colaborador={colaborador}
          monthName={MONTH_NAMES[mes - 1]}
          ano={ano}
          jornadaPadrao={jornadaPadrao}
          computedRows={computedRows}
          totalMinutes={totalMinutes}
          totalExtraMinutes={totalExtraMinutes}
          onUpdateRow={updateRow}
        />

        <p className="mt-4 text-center text-xs text-cozy-muted no-print">
          Seus dados são salvos automaticamente no navegador (localStorage) — nada é enviado para nenhum servidor.
        </p>
      </main>
    </div>
  )
}
