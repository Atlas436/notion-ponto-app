import { diffMinutes } from './time'

// Paleta fixa pra manter as tags dentro do estilo pastel do app.
export const TAG_COLOR_PALETTE = [
  '#7C5CBF', // lavanda
  '#5B7A52', // sálvia
  '#B85C3F', // terracota
  '#9B5C8F', // ameixa
  '#4A7C9B', // azul empoeirado
  '#B8964A', // mostarda
  '#C2607E', // rosa
  '#4F9C8C', // verde-água
]

export function createEmptyTask() {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { id, inicio: '', fim: '', tarefa: '', tagId: null }
}

export function createTag(name, color) {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { id, name, color: color || TAG_COLOR_PALETTE[0] }
}

export function taskDuration(task) {
  return diffMinutes(task.inicio, task.fim)
}

export function sumTaskMinutes(tarefas = []) {
  return tarefas.reduce((acc, t) => acc + taskDuration(t), 0)
}

export function findTag(tags, tagId) {
  return tags.find((t) => t.id === tagId) ?? null
}

function formatTaskLine(task, tags) {
  const time = task.inicio && task.fim ? `${task.inicio}–${task.fim}` : task.inicio || task.fim || ''
  const tag = task.tagId ? findTag(tags, task.tagId) : null
  const label = [task.tarefa, tag ? `#${tag.name}` : ''].filter(Boolean).join(' ')
  if (time && label) return `${time} ${label}`
  return time || label || ''
}

// Uma linha por tarefa preenchida (horário, nome e/ou tag), pra usar nas exportações.
export function formatTasksSummary(tarefas = [], tags = []) {
  return tarefas
    .filter((t) => t.inicio || t.fim || t.tarefa || t.tagId)
    .map((t) => formatTaskLine(t, tags))
    .join('\n')
}

// Célula de "Descrição/Atividades" usada nas exportações: tarefas detalhadas primeiro
// (uma por linha), seguidas da anotação livre, se houver as duas coisas.
export function buildDescricaoCell(row, tags = []) {
  const tasksText = formatTasksSummary(row.tarefas ?? [], tags)
  if (tasksText && row.descricao) return `${tasksText}\n${row.descricao}`
  return tasksText || row.descricao || ''
}
