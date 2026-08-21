import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatDateBR } from '../utils/time'

export default function HolidaysPanel({ ano, holidays, onToggle, onRemove, onAdd }) {
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [recurring, setRecurring] = useState(true)
  const [touched, setTouched] = useState(false)

  const canSubmit = Boolean(newDate) && newName.trim().length > 0

  function handleAdd(e) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onAdd({ date: newDate, name: newName.trim(), recurring })
    setNewDate('')
    setNewName('')
    setTouched(false)
  }

  return (
    <div className="no-print mb-6 rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-cozy-text">Feriados de {ano}</h2>
      <p className="mt-1 text-xs text-cozy-muted">
        Nacionais e estaduais (SP) já vêm marcados e contam como dia não-trabalhado — se você registrar horário
        neles, tudo vira hora extra, igual fim de semana. Desmarque o que não valer pra você, ou adicione uma data
        pessoal (aniversário, feriado municipal etc.).
      </p>

      <ul className="mt-4 divide-y divide-cozy-border">
        {holidays.map((h) => (
          <li key={h.recurring ? `r-${h.id}` : h.date} className="flex items-center gap-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={() => onToggle(h)}
              className="h-4 w-4 accent-cozy-accent"
            />
            <span className="w-20 whitespace-nowrap font-mono text-cozy-muted">{formatDateBR(h.date)}</span>
            <span className={`flex-1 ${h.enabled ? 'text-cozy-text' : 'text-cozy-muted line-through'}`}>{h.name}</span>
            <span className="whitespace-nowrap rounded-full bg-cozy-weekend px-2 py-0.5 text-[10px] font-medium text-cozy-muted">
              {h.scope}
            </span>
            {h.custom && (
              <button
                type="button"
                onClick={() => onRemove(h)}
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

      <form onSubmit={handleAdd} className="mt-4 border-t border-cozy-border pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-cozy-muted">Data</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className={`rounded-lg border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20 ${
                touched && !newDate ? 'border-red-400' : 'border-cozy-border'
              }`}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-cozy-muted">Nome (ex.: Meu aniversário)</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full rounded-lg border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20 ${
                touched && !newName.trim() ? 'border-red-400' : 'border-cozy-border'
              }`}
            />
          </label>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-cozy-muted">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="h-3.5 w-3.5 accent-cozy-accent"
          />
          Repetir todo ano (recomendado para aniversários e feriados municipais)
        </label>

        {touched && !canSubmit && (
          <p className="mt-1.5 text-xs text-red-500">Preencha a data e o nome antes de adicionar.</p>
        )}
      </form>
    </div>
  )
}
