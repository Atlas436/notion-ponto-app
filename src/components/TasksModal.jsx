import { useState } from 'react'
import { Check, Plus, Tag, Trash2, X } from 'lucide-react'
import { formatDateBR, minutesToTime } from '../utils/time'
import { createEmptyTask, findTags, getTaskTagIds, sumTaskMinutes, taskDuration, TAG_COLOR_PALETTE } from '../utils/tasks'

export default function TasksModal({ date, tarefas, tags, jornadaPadrao, onChangeTasks, onAddTag, onRemoveTag, onClose }) {
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PALETTE[0])
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

  function addTaskWithTag(tagId) {
    onChangeTasks([...tarefas, { ...createEmptyTask(), tagIds: [tagId] }])
  }

  function addTagToTask(id, tagId) {
    onChangeTasks(
      tarefas.map((t) => {
        if (t.id !== id) return t
        const current = getTaskTagIds(t)
        if (current.includes(tagId)) return t
        return { ...t, tagIds: [...current, tagId] }
      }),
    )
  }

  function removeTagFromTask(id, tagId) {
    onChangeTasks(
      tarefas.map((t) => (t.id === id ? { ...t, tagIds: getTaskTagIds(t).filter((tid) => tid !== tagId) } : t)),
    )
  }

  function handleAddTag(e) {
    e.preventDefault()
    if (!newTagName.trim()) return
    onAddTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setNewTagColor(TAG_COLOR_PALETTE[0])
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
          {tarefas.map((t) => {
            const assignedTagIds = getTaskTagIds(t)
            const assignedTags = findTags(tags, assignedTagIds)
            const availableTags = tags.filter((tag) => !assignedTagIds.includes(tag.id))
            return (
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

                <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-1">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addTagToTask(t.id, e.target.value)
                    }}
                    disabled={availableTags.length === 0}
                    className="rounded-lg border border-cozy-border bg-cozy-panel px-2 py-1 text-[11px] text-cozy-muted outline-none focus:border-cozy-accent disabled:opacity-50"
                  >
                    <option value="">
                      {tags.length === 0
                        ? 'Nenhuma tag salva'
                        : availableTags.length === 0
                          ? 'Todas as tags já adicionadas'
                          : 'Adicionar tag…'}
                    </option>
                    {availableTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>

                  {assignedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTagFromTask(t.id, tag.id)}
                        aria-label={`Remover tag ${tag.name} desta tarefa`}
                        className="opacity-70 hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          {tarefas.length === 0 && <p className="py-4 text-center text-sm text-cozy-muted">Nenhuma tarefa ainda.</p>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addTask}
            className="flex items-center gap-1.5 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
          >
            <Plus size={14} /> Adicionar tarefa
          </button>

          {tags.length > 0 && (
            <>
              <span className="text-xs text-cozy-muted">ou adicionar direto com uma tag:</span>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTaskWithTag(tag.id)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-transform hover:scale-105"
                  style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                >
                  + {tag.name}
                </button>
              ))}
            </>
          )}
        </div>

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
          <Tag size={12} /> {showTagManager ? 'Esconder gerenciador de tags' : 'Gerenciar tags'}
        </button>

        {showTagManager && (
          <div className="mt-2 rounded-xl border border-cozy-border p-3">
            <ul className="space-y-1.5">
              {tags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag.id)}
                    aria-label={`Excluir tag ${tag.name}`}
                    className="text-cozy-muted transition-colors hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
              {tags.length === 0 && <li className="text-xs text-cozy-muted">Nenhuma tag salva ainda.</li>}
            </ul>

            <form onSubmit={handleAddTag} className="mt-3 border-t border-cozy-border pt-3">
              <label className="text-xs font-medium text-cozy-muted">Nome da nova tag</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex.: Reunião"
                  className="flex-1 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend"
                >
                  <Plus size={14} /> Salvar
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-cozy-muted">Cor:</span>
                {TAG_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    aria-label={`Escolher cor ${color}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: color }}
                  >
                    {newTagColor === color && <Check size={13} className="text-white" />}
                  </button>
                ))}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
