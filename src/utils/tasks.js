import { diffMinutes } from './time'

export function createEmptyTask() {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { id, inicio: '', fim: '', tarefa: '' }
}

export function taskDuration(task) {
  return diffMinutes(task.inicio, task.fim)
}

export function sumTaskMinutes(tarefas = []) {
  return tarefas.reduce((acc, t) => acc + taskDuration(t), 0)
}

function formatTaskLine(task) {
  const time = task.inicio && task.fim ? `${task.inicio}–${task.fim}` : task.inicio || task.fim || ''
  if (time && task.tarefa) return `${time} ${task.tarefa}`
  return time || task.tarefa || ''
}

// Uma linha por tarefa preenchida (horário e/ou nome), pra usar nas exportações.
export function formatTasksSummary(tarefas = []) {
  return tarefas
    .filter((t) => t.inicio || t.fim || t.tarefa)
    .map(formatTaskLine)
    .join('\n')
}

// Célula de "Descrição/Atividades" usada nas exportações: tarefas detalhadas primeiro
// (uma por linha), seguidas da anotação livre, se houver as duas coisas.
export function buildDescricaoCell(row) {
  const tasksText = formatTasksSummary(row.tarefas ?? [])
  if (tasksText && row.descricao) return `${tasksText}\n${row.descricao}`
  return tasksText || row.descricao || ''
}
