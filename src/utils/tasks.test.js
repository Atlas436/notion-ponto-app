import { describe, expect, it } from 'vitest'
import {
  buildDescricaoCell,
  createEmptyTask,
  createTag,
  findTag,
  findTags,
  formatTasksSummary,
  getTaskTagIds,
  sumTaskMinutes,
  taskDuration,
  TAG_COLOR_PALETTE,
} from './tasks'

describe('createEmptyTask', () => {
  it('cria uma tarefa vazia com id único e sem tags', () => {
    const a = createEmptyTask()
    const b = createEmptyTask()
    expect(a).toMatchObject({ inicio: '', fim: '', tarefa: '', tagIds: [] })
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

describe('findTag / findTags', () => {
  it('encontra a tag pelo id', () => {
    const tags = [createTag('Reunião', '#111'), createTag('Pausa', '#222')]
    expect(findTag(tags, tags[1].id)).toMatchObject({ name: 'Pausa', color: '#222' })
  })

  it('retorna null quando não encontra', () => {
    expect(findTag([], 'algum-id')).toBeNull()
    expect(findTag([createTag('Reunião')], 'outro-id')).toBeNull()
  })

  it('findTags resolve várias tags na ordem dos ids, ignorando as que não existem mais', () => {
    const tags = [createTag('Reunião', '#111'), createTag('Pausa', '#222')]
    expect(findTags(tags, [tags[1].id, tags[0].id])).toEqual([tags[1], tags[0]])
    expect(findTags(tags, [tags[0].id, 'removida'])).toEqual([tags[0]])
    expect(findTags(tags, [])).toEqual([])
  })
})

describe('getTaskTagIds', () => {
  it('lê tagIds (formato novo, múltiplas tags)', () => {
    expect(getTaskTagIds({ tagIds: ['a', 'b'] })).toEqual(['a', 'b'])
  })

  it('cai pro formato antigo (tagId único) quando tagIds não existe', () => {
    expect(getTaskTagIds({ tagId: 'a' })).toEqual(['a'])
    expect(getTaskTagIds({ tagId: null })).toEqual([])
  })

  it('retorna array vazio quando não há nenhuma tag', () => {
    expect(getTaskTagIds({})).toEqual([])
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

  it('ignora tarefas completamente vazias (sem horário, nome ou tags)', () => {
    const tarefas = [
      { inicio: '', fim: '', tarefa: '', tagIds: [] },
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
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagIds: [tag.id] }]
    expect(formatTasksSummary(tarefas, [tag])).toBe('17:30–18:15 Alinhamento #Reunião')
  })

  it('inclui várias tags na mesma tarefa, uma depois da outra', () => {
    const reuniao = createTag('Reunião', '#7C5CBF')
    const urgente = createTag('Urgente', '#B85C3F')
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagIds: [reuniao.id, urgente.id] }]
    expect(formatTasksSummary(tarefas, [reuniao, urgente])).toBe('17:30–18:15 Alinhamento #Reunião #Urgente')
  })

  it('inclui a tag mesmo sem descrição livre da tarefa', () => {
    const tag = createTag('Pausa', '#111')
    const tarefas = [{ inicio: '', fim: '', tarefa: '', tagIds: [tag.id] }]
    expect(formatTasksSummary(tarefas, [tag])).toBe('#Pausa')
  })

  it('não quebra se uma tag referenciada não existir mais na lista', () => {
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Ajustei relatório X', tagIds: ['tag-removida'] }]
    expect(formatTasksSummary(tarefas, [])).toBe('17:30–18:15 Ajustei relatório X')
  })

  it('continua funcionando com o formato antigo (tagId único) de tarefas salvas antes', () => {
    const tag = createTag('Reunião', '#7C5CBF')
    const tarefas = [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagId: tag.id }]
    expect(formatTasksSummary(tarefas, [tag])).toBe('17:30–18:15 Alinhamento #Reunião')
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

  it('repassa a lista de tags pra resolver o nome de cada tarefa marcada (múltiplas tags)', () => {
    const reuniao = createTag('Reunião', '#7C5CBF')
    const urgente = createTag('Urgente', '#B85C3F')
    const row = {
      tarefas: [{ inicio: '17:30', fim: '18:15', tarefa: 'Alinhamento', tagIds: [reuniao.id, urgente.id] }],
      descricao: '',
    }
    expect(buildDescricaoCell(row, [reuniao, urgente])).toBe('17:30–18:15 Alinhamento #Reunião #Urgente')
  })

  it('retorna string vazia quando não há nada', () => {
    expect(buildDescricaoCell({ tarefas: [], descricao: '' })).toBe('')
    expect(buildDescricaoCell({})).toBe('')
  })
})
