import { describe, expect, it } from 'vitest'
import { buildDescricaoCell, createEmptyTask, formatTasksSummary, sumTaskMinutes, taskDuration } from './tasks'

describe('createEmptyTask', () => {
  it('cria uma tarefa vazia com id único', () => {
    const a = createEmptyTask()
    const b = createEmptyTask()
    expect(a).toMatchObject({ inicio: '', fim: '', tarefa: '' })
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })
})

describe('taskDuration', () => {
  it('calcula a duração entre início e fim', () => {
    expect(taskDuration({ inicio: '17:30', fim: '18:15' })).toBe(45)
  })

  it('retorna 0 quando início ou fim estão vazios', () => {
    expect(taskDuration({ inicio: '', fim: '18:15' })).toBe(0)
    expect(taskDuration({ inicio: '17:30', fim: '' })).toBe(0)
  })
})

describe('sumTaskMinutes', () => {
  it('soma a duração de todas as tarefas', () => {
    const tarefas = [
      { inicio: '17:30', fim: '18:15' }, // 45
      { inicio: '18:15', fim: '19:00' }, // 45
      { inicio: '', fim: '' }, // 0
    ]
    expect(sumTaskMinutes(tarefas)).toBe(90)
  })

  it('retorna 0 para lista vazia ou indefinida', () => {
    expect(sumTaskMinutes([])).toBe(0)
    expect(sumTaskMinutes()).toBe(0)
  })
})

describe('formatTasksSummary', () => {
  it('formata cada tarefa preenchida como uma linha "HH:mm–HH:mm nome"', () => {
    const tarefas = [
      { inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X' },
      { inicio: '18:15', fim: '19:00', tarefa: 'Atendi chamado da chefe' },
    ]
    expect(formatTasksSummary(tarefas)).toBe('17:30–18:15 Ajustei relatório X\n18:15–19:00 Atendi chamado da chefe')
  })

  it('ignora tarefas completamente vazias', () => {
    const tarefas = [
      { inicio: '', fim: '', tarefa: '' },
      { inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X' },
    ]
    expect(formatTasksSummary(tarefas)).toBe('17:30–18:15 Ajustei relatório X')
  })

  it('lida com tarefa só com nome (sem horário) ou só com horário (sem nome)', () => {
    expect(formatTasksSummary([{ inicio: '', fim: '', tarefa: 'Pausa' }])).toBe('Pausa')
    expect(formatTasksSummary([{ inicio: '17:30', fim: '18:15', tarefa: '' }])).toBe('17:30–18:15')
  })

  it('retorna string vazia sem tarefas', () => {
    expect(formatTasksSummary([])).toBe('')
    expect(formatTasksSummary()).toBe('')
  })
})

describe('buildDescricaoCell', () => {
  it('usa o resumo das tarefas quando existem, ignorando a descrição livre se ambas presentes', () => {
    const row = {
      tarefas: [{ inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X' }],
      descricao: 'Observação geral do dia',
    }
    expect(buildDescricaoCell(row)).toBe('17:30–18:15 Ajustei relatório X\nObservação geral do dia')
  })

  it('usa só a descrição livre quando não há tarefas', () => {
    const row = { tarefas: [], descricao: 'Observação geral do dia' }
    expect(buildDescricaoCell(row)).toBe('Observação geral do dia')
  })

  it('usa só as tarefas quando não há descrição livre', () => {
    const row = { tarefas: [{ inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X' }], descricao: '' }
    expect(buildDescricaoCell(row)).toBe('17:30–18:15 Ajustei relatório X')
  })

  it('retorna string vazia quando não há nada', () => {
    expect(buildDescricaoCell({ tarefas: [], descricao: '' })).toBe('')
    expect(buildDescricaoCell({})).toBe('')
  })
})
