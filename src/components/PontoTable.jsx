import { forwardRef } from 'react'
import { formatDateBR, minutesToTime } from '../utils/time'

const PontoTable = forwardRef(function PontoTable(
  { colaborador, monthName, ano, jornadaPadrao, computedRows, totalMinutes, totalExtraMinutes, onUpdateRow },
  ref,
) {
  return (
    <div ref={ref} className="rounded-xl border border-cozy-border bg-cozy-panel shadow-sm">
      <div className="border-b border-cozy-border px-5 py-4">
        <h2 className="text-lg font-semibold text-cozy-text">Relatório de Ponto — {colaborador || 'Colaborador(a)'}</h2>
        <p className="text-sm text-cozy-muted">
          {monthName} / {ano} · Jornada diária padrão: {jornadaPadrao}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-cozy-border text-xs font-medium uppercase tracking-wide text-cozy-muted">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Dia</th>
              <th className="px-3 py-2">Entrada</th>
              <th className="px-3 py-2">Saída</th>
              <th className="px-3 py-2">Total Trabalhado</th>
              <th className="px-3 py-2">Horas Extras</th>
              <th className="px-3 py-2">Descrição / Atividades</th>
            </tr>
          </thead>
          <tbody>
            {computedRows.map((row) => (
              <tr
                key={row.date}
                className={`border-b border-cozy-border last:border-b-0 ${
                  row.weekend ? 'bg-cozy-weekend' : 'bg-cozy-panel'
                }`}
              >
                <td className="whitespace-nowrap px-3 py-1 font-medium text-cozy-text">{formatDateBR(row.date)}</td>
                <td className="whitespace-nowrap px-3 py-1 text-cozy-muted">{row.weekdayLabel}</td>
                <td className="px-1 py-1">
                  <input
                    type="time"
                    value={row.entrada}
                    onChange={(e) => onUpdateRow(row.date, 'entrada', e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="time"
                    value={row.saida}
                    onChange={(e) => onUpdateRow(row.date, 'saida', e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-1 font-mono text-cozy-text">
                  {minutesToTime(row.totalMinutes)}
                </td>
                <td className="whitespace-nowrap px-3 py-1 font-mono">
                  <span className={row.extraMinutes > 0 ? 'font-semibold text-cozy-extra' : 'text-cozy-muted'}>
                    {minutesToTime(row.extraMinutes)}
                  </span>
                  {row.weekend && row.totalMinutes > 0 && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-cozy-extra no-print">
                      fim de semana
                    </span>
                  )}
                </td>
                <td className="px-1 py-1">
                  <input
                    type="text"
                    value={row.descricao}
                    onChange={(e) => onUpdateRow(row.date, 'descricao', e.target.value)}
                    placeholder="Ex.: Ajustei relatório X"
                    className="cell-input min-w-[220px]"
                  />
                </td>
              </tr>
            ))}
            {computedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-cozy-muted">
                  Nenhum registro ainda. Selecione um mês e clique em "Gerar / Resetar Mês".
                </td>
              </tr>
            )}
          </tbody>
          {computedRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-cozy-border bg-cozy-weekend font-semibold text-cozy-text">
                <td className="px-3 py-2.5" colSpan={4}>
                  Total do Mês
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono">{minutesToTime(totalMinutes)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-cozy-extra">
                  {minutesToTime(totalExtraMinutes)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
})

export default PontoTable
