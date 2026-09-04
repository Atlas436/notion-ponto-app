import { describe, expect, it } from 'vitest'
import {
  buildDescricaoCell,
  createEmptyTask,
  createTag,
  findTag,
  formatTasksSummary,
  sumTaskMinutes,
  taskDuration,
  TAG_COLOR_PALETTE,
} from './tasks'

describe('createEmptyTask', () => {
  it('cria uma tarefa vazia com id único e sem tag', () => {
    const a = createEmptyTask()
    const b = createEmptyTask()
    expect(a).toMatchObject({ inicio: '', fim: '', tarefa: '', tagId: null })
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })
})

describe('createTag', () => {
  it('cria uma tag com id único, nome e cor', () => {
    const a = createTag('Reunião', '#7C5CBF')
    const b = createTag('Reunião', '#7C5CBF')
    expect(a).toMatchObject({ name: 'Reunião', color: '#7C5CBF' })
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })

  it('usa a primeira cor da paleta se nenhuma cor for informada', () => {
    const a = createTag('Reunião')
    expect(a.color).toBe(TAG_COLOR_PALETTE[0])
  })
})

describe('findTag', () => {
  it('encontra a tag pelo id', () => {
    const tags = [createTag('Reunião', '#111'), createTag('Pausa', '#222')]
    expect(findTag(tags, tags[1].id)).toMatchObject({ name: 'Pausa', color: '#222' })
  })

  it('retorna null quando não encontra', () => {
    expect(findTag([], 'algum-id')).toBeNull()
    expect(findTag([createTag('Reunião')], 'outro-id')).toBeNull()
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

  it('ignora tarefas completamente vazias (sem horário, nome ou tag)', () => {
    const tarefas = [
      { inicio: '', fim: '', tarefa: '', tagId: null },
      { inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X' },
    ]
    expect(formatTasksSummary(tarefas)).toBe('17:30–18:15 Ajustei relatório X')
  })

  it('lida com tarefa só com nome (sem horário) ou só com horário (sem nome)', () => {
    expect(formatTasksSummary([{ inicio: '', fim: '', tarefa: 'Pausa' }])).toBe('Pausa')
    expect(formatTasksSummary([{ inicio: '17:30', fim: '18:15', tarefa: '' }])).toBe('17:30–18:15')
  })

  it('inclui o nome da tag (como #Tag) junto do horário e da tarefa', () => {
    const tag = createTag('Reunião', '#7C5CBF')
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagId: tag.id }]
    expect(formatTasksSummary(tarefas, [tag])).toBe('17:30–18:15 Alinhamento #Reunião')
  })

  it('inclui a tag mesmo sem descrição livre da tarefa', () => {
    const tag = createTag('Pausa', '#111')
    const tarefas = [{ inicio: '', fim: '', tarefa: '', tagId: tag.id }]
    expect(formatTasksSummary(tarefas, [tag])).toBe('#Pausa')
  })

  it('não quebra se a tag referenciada não existir mais na lista', () => {
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X', tagId: 'tag-removida' }]
    expect(formatTasksSummary(tarefas, [])).toBe('17:30–18:15 Ajustei relatório X')
  })

  it('retorna string vazia sem tarefas', () => {
    expect(formatTasksSummary([])).toBe('')
    expect(formatTasksSummary()).toBe('')
  })
})

describe('buildDescricaoCell', () => {
  it('usa o resumo das tarefas quando existem, seguido da descrição livre se ambas presentes', () => {
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

  it('repassa a lista de tags pra resolver o nome de cada tarefa marcada', () => {
    const tag = createTag('Reunião', '#7C5CBF')
    const row = { tarefas: [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagId: tag.id }], descricao: '' }
    expect(buildDescricaoCell(row, [tag])).toBe('17:30–18:15 Alinhamento #Reunião')
  })

  it('retorna string vazia quando não há nada', () => {
    expect(buildDescricaoCell({ tarefas: [], descricao: '' })).toBe('')
    expect(buildDescricaoCell({})).toBe('')
  })
})
