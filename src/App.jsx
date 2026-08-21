import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import HolidaysPanel from './components/HolidaysPanel'
import PontoTable from './components/PontoTable'
import {
  loadSettings,
  saveSettings,
  loadMonthRows,
  saveMonthRows,
  loadHolidays,
  saveHolidays,
} from './utils/storage'
import { getDefaultHolidays } from './utils/holidays'
import { computeRow, generateMonthRows, MONTH_NAMES, parseTimeToMinutes } from './utils/time'
import { exportToExcel } from './utils/exportExcel'

const today = new Date()
const initialSettings = loadSettings()

export default function App() {
  const [colaborador, setColaborador] = useState(initialSettings.colaborador)
  const [jornadaPadrao, setJornadaPadrao] = useState(initialSettings.jornadaPadrao)
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [ano, setAno] = useState(today.getFullYear())
  const [holidays, setHolidays] = useState(() => loadHolidays(today.getFullYear()) ?? getDefaultHolidays(today.getFullYear()))
  const [showHolidays, setShowHolidays] = useState(false)
  const [rows, setRows] = useState(() => {
    const activeDates = new Set(holidays.filter((h) => h.enabled).map((h) => h.date))
    return loadMonthRows(ano, mes) ?? generateMonthRows(ano, mes, activeDates)
  })

  const reportRef = useRef(null)

  useEffect(() => {
    saveSettings({ colaborador, jornadaPadrao })
  }, [colaborador, jornadaPadrao])

  useEffect(() => {
    // Resolve os feriados do ano primeiro (síncrono, sem depender do state antigo) para
    // que a geração do mês abaixo já saiba quais dias são não-trabalhados.
    const resolvedHolidays = loadHolidays(ano) ?? getDefaultHolidays(ano)
    setHolidays(resolvedHolidays)

    const saved = loadMonthRows(ano, mes)
    if (saved) {
      setRows(saved)
    } else {
      const activeDates = new Set(resolvedHolidays.filter((h) => h.enabled).map((h) => h.date))
      const generated = generateMonthRows(ano, mes, activeDates)
      setRows(generated)
      saveMonthRows(ano, mes, generated)
    }
  }, [ano, mes])

  const jornadaPadraoMinutes = useMemo(() => parseTimeToMinutes(jornadaPadrao) ?? 240, [jornadaPadrao])

  const holidayNames = useMemo(
    () => new Map(holidays.filter((h) => h.enabled).map((h) => [h.date, h.name])),
    [holidays],
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
    const activeDates = new Set(holidays.filter((h) => h.enabled).map((h) => h.date))
    const generated = generateMonthRows(ano, mes, activeDates)
    setRows(generated)
    saveMonthRows(ano, mes, generated)
  }

  function updateHolidays(next) {
    setHolidays(next)
    saveHolidays(ano, next)
  }

  function toggleHoliday(date) {
    updateHolidays(holidays.map((h) => (h.date === date ? { ...h, enabled: !h.enabled } : h)))
  }

  function removeHoliday(date) {
    updateHolidays(holidays.filter((h) => h.date !== date))
  }

  function addHoliday({ date, name }) {
    const exists = holidays.some((h) => h.date === date)
    if (exists) {
      updateHolidays(holidays.map((h) => (h.date === date ? { ...h, name, enabled: true } : h)))
      return
    }
    const next = [...holidays, { date, name, scope: 'personalizado', enabled: true, custom: true }].sort((a, b) =>
      a.date > b.date ? 1 : -1,
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
        onGenerateReset={handleGenerateReset}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {showHolidays && (
          <HolidaysPanel ano={ano} holidays={holidays} onToggle={toggleHoliday} onRemove={removeHoliday} onAdd={addHoliday} />
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
