import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import PontoTable from './components/PontoTable'
import { loadSettings, saveSettings, loadMonthRows, saveMonthRows } from './utils/storage'
import { computeRow, generateMonthRows, MONTH_NAMES, parseTimeToMinutes } from './utils/time'
import { exportToExcel } from './utils/exportExcel'

const today = new Date()
const initialSettings = loadSettings()

export default function App() {
  const [colaborador, setColaborador] = useState(initialSettings.colaborador)
  const [jornadaPadrao, setJornadaPadrao] = useState(initialSettings.jornadaPadrao)
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [ano, setAno] = useState(today.getFullYear())
  const [rows, setRows] = useState(() => loadMonthRows(ano, mes) ?? generateMonthRows(ano, mes))

  const reportRef = useRef(null)

  useEffect(() => {
    saveSettings({ colaborador, jornadaPadrao })
  }, [colaborador, jornadaPadrao])

  useEffect(() => {
    const saved = loadMonthRows(ano, mes)
    if (saved) {
      setRows(saved)
    } else {
      const generated = generateMonthRows(ano, mes)
      setRows(generated)
      saveMonthRows(ano, mes, generated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes])

  const jornadaPadraoMinutes = useMemo(() => parseTimeToMinutes(jornadaPadrao) ?? 240, [jornadaPadrao])

  const computedRows = useMemo(
    () => rows.map((row) => computeRow(row, jornadaPadraoMinutes)),
    [rows, jornadaPadraoMinutes],
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
    const generated = generateMonthRows(ano, mes)
    setRows(generated)
    saveMonthRows(ano, mes, generated)
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
        onGenerateReset={handleGenerateReset}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
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
