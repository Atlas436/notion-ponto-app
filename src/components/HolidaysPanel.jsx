import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatDateBR } from '../utils/time'

export default function HolidaysPanel({ ano, holidays, onToggle, onRemove, onAdd }) {
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!newDate || !newName.trim()) return
    onAdd({ date: newDate, name: newName.trim() })
    setNewDate('')
    setNewName('')
  }

  return (
    <div className="no-print mb-6 rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-cozy-text">Feriados de {ano}</h2>
      <p className="mt-1 text-xs text-cozy-muted">
        Nacionais e estaduais (SP) já vêm marcados e contam como dia não-trabalhado — se você registrar horário
        neles, tudo vira hora extra, igual fim de semana. Desmarque o que não valer pra você, ou adicione um
        feriado municipal.
      </p>

      <ul className="mt-4 divide-y divide-cozy-border">
        {holidays.map((h) => (
          <li key={h.date} className="flex items-center gap-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={() => onToggle(h.date)}
              className="h-4 w-4 accent-cozy-accent"
            />
            <span className="w-20 whitespace-nowrap font-mono text-cozy-muted">{formatDateBR(h.date)}</span>
            <span className={`flex-1 ${h.enabled ? 'text-cozy-text' : 'text-cozy-muted line-through'}`}>{h.name}</span>
            <span className="rounded-full bg-cozy-weekend px-2 py-0.5 text-[10px] font-medium text-cozy-muted">
              {h.scope}
            </span>
            {h.custom && (
              <button
                type="button"
                onClick={() => onRemove(h.date)}
                className="text-cozy-muted transition-colors hover:text-red-600"
                aria-label={`Remover ${h.name}`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
        {holidays.length === 0 && <li className="py-2 text-sm text-cozy-muted">Nenhum feriado cadastrado.</li>}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-2 border-t border-cozy-border pt-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-cozy-muted">Data</span>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-cozy-muted">Nome (ex.: Aniversário da cidade)</span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
          />
        </label>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
        >
          <Plus size={14} /> Adicionar feriado
        </button>
      </form>
    </div>
  )
}
