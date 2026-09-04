import { useState } from 'react'
import { Plus, Tag, Trash2, X } from 'lucide-react'
import { formatDateBR, minutesToTime } from '../utils/time'
import { createEmptyTask, sumTaskMinutes, taskDuration } from '../utils/tasks'

export default function TasksModal({ date, tarefas, tags, jornadaPadrao, onChangeTasks, onAddTag, onRemoveTag, onClose }) {
  const [newTag, setNewTag] = useState('')
  const [showTagManager, setShowTagManager] = useState(false)

  function updateTask(id, field, value) {
    onChangeTasks(tarefas.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  function removeTask(id) {
    onChangeTasks(tarefas.filter((t) => t.id !== id))
  }

  function addTask() {
    onChangeTasks([...tarefas, createEmptyTask()])
  }

  function handleAddTag(e) {
    e.preventDefault()
    if (!newTag.trim()) return
    onAddTag(newTag.trim())
    setNewTag('')
  }

  const totalMinutes = sumTaskMinutes(tarefas)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 no-print" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cozy-text">Tarefas — {formatDateBR(date)}</h2>
            <p className="mt-0.5 text-xs text-cozy-muted">Registre o horário exato de cada atividade dentro da sua jornada.</p>
          </div>
          <button type="button" onClick={onClose} className="text-cozy-muted transition-colors hover:text-cozy-text" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {tarefas.map((t) => (
            <div key={t.id} className="rounded-xl border border-cozy-border p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={t.inicio}
                  onChange={(e) => updateTask(t.id, 'inicio', e.target.value)}
                  className="cell-input w-28 border-cozy-border"
                />
                <span className="text-cozy-muted">–</span>
                <input
                  type="time"
                  value={t.fim}
                  onChange={(e) => updateTask(t.id, 'fim', e.target.value)}
                  className="cell-input w-28 border-cozy-border"
                />
                <span className="w-14 shrink-0 whitespace-nowrap font-mono text-xs text-cozy-muted">
                  {minutesToTime(taskDuration(t))}
                </span>
                <input
                  type="text"
                  value={t.tarefa}
                  onChange={(e) => updateTask(t.id, 'tarefa', e.target.value)}
                  placeholder="O que você fez"
                  className="cell-input min-w-[160px] flex-1 border-cozy-border"
                />
                <button
                  type="button"
                  onClick={() => removeTask(t.id)}
                  className="text-cozy-muted transition-colors hover:text-red-600"
                  aria-label="Remover tarefa"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => updateTask(t.id, 'tarefa', tag)}
                      className="rounded-full bg-cozy-weekend px-2 py-0.5 text-[11px] text-cozy-muted transition-colors hover:bg-cozy-accent/15 hover:text-cozy-accent"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {tarefas.length === 0 && <p className="py-4 text-center text-sm text-cozy-muted">Nenhuma tarefa ainda.</p>}
        </div>

        <button
          type="button"
          onClick={addTask}
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
        >
          <Plus size={14} /> Adicionar tarefa
        </button>

        <div className="mt-4 flex items-center justify-between border-t border-cozy-border pt-3 text-sm">
          <span className="text-cozy-muted">Total registrado nas tarefas</span>
          <span className="font-mono font-semibold text-cozy-text">
            {minutesToTime(totalMinutes)}
            {jornadaPadrao ? ` / ${jornadaPadrao}` : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowTagManager((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-cozy-accent underline decoration-dotted underline-offset-2"
        >
          <Tag size={12} /> {showTagManager ? 'Esconder tags salvas' : 'Gerenciar tags salvas'}
        </button>

        {showTagManager && (
          <div className="mt-2 rounded-xl border border-cozy-border p-3">
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag} className="flex items-center gap-1 rounded-full bg-cozy-weekend px-2 py-0.5 text-[11px] text-cozy-text">
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="text-cozy-muted transition-colors hover:text-red-600"
                    aria-label={`Remover tag ${tag}`}
                  >
                    <X size={11} />
                  </button>
                </li>
              ))}
              {tags.length === 0 && <li className="text-xs text-cozy-muted">Nenhuma tag salva ainda.</li>}
            </ul>
            <form onSubmit={handleAddTag} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nova tag (ex.: Reunião)"
                className="flex-1 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
              >
                <Plus size={14} /> Salvar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
