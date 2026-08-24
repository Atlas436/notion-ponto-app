import { describe, expect, it } from 'vitest'
import {
  computeRow,
  diffMinutes,
  formatDateBR,
  generateMonthRows,
  getWeekdayIndex,
  isWeekend,
  minutesToTime,
  parseTimeToMinutes,
  todayDateKey,
} from './time'

describe('parseTimeToMinutes', () => {
  it('converte HH:mm para minutos desde a meia-noite', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('17:30')).toBe(17 * 60 + 30)
    expect(parseTimeToMinutes('21:30')).toBe(21 * 60 + 30)
    expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59)
  })

  it('retorna null para valores vazios ou inválidos', () => {
    expect(parseTimeToMinutes('')).toBeNull()
    expect(parseTimeToMinutes(undefined)).toBeNull()
    expect(parseTimeToMinutes('não é hora')).toBeNull()
    expect(parseTimeToMinutes('12:99')).toBeNull()
  })
})

describe('minutesToTime', () => {
  it('formata minutos como HH:mm com zero à esquerda', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(45)).toBe('00:45')
    expect(minutesToTime(240)).toBe('04:00')
  })

  it('suporta totais acima de 24h (ex.: soma mensal)', () => {
    expect(minutesToTime(84 * 60)).toBe('84:00')
  })

  it('trata valores nulos/indefinidos como 00:00', () => {
    expect(minutesToTime(null)).toBe('00:00')
    expect(minutesToTime(undefined)).toBe('00:00')
  })
})

describe('diffMinutes', () => {
  it('calcula a diferença entre entrada e saída no mesmo dia', () => {
    expect(diffMinutes('17:30', '21:30')).toBe(240)
    expect(diffMinutes('09:00', '18:00')).toBe(9 * 60)
  })

  it('retorna 0 quando entrada ou saída estão ausentes', () => {
    expect(diffMinutes('', '21:30')).toBe(0)
    expect(diffMinutes('17:30', '')).toBe(0)
    expect(diffMinutes('', '')).toBe(0)
  })

  it('trata saída menor que entrada como turno que vira a noite', () => {
    expect(diffMinutes('22:00', '02:00')).toBe(4 * 60)
  })
})

describe('isWeekend', () => {
  it('identifica sábado (6) e domingo (0) como fim de semana', () => {
    expect(isWeekend(0)).toBe(true)
    expect(isWeekend(6)).toBe(true)
  })

  it('não marca dias úteis como fim de semana', () => {
    for (const dow of [1, 2, 3, 4, 5]) {
      expect(isWeekend(dow)).toBe(false)
    }
  })
})

describe('formatDateBR / getWeekdayIndex', () => {
  it('formata uma data ISO como DD/MM/AAAA', () => {
    expect(formatDateBR('2026-03-05')).toBe('05/03/2026')
  })

  it('calcula o dia da semana correto para uma data ISO', () => {
    // 2026-03-02 é uma segunda-feira
    expect(getWeekdayIndex('2026-03-02')).toBe(1)
    // 2026-03-07 é um sábado
    expect(getWeekdayIndex('2026-03-07')).toBe(6)
  })
})

describe('generateMonthRows', () => {
  it('gera uma linha para cada dia do mês', () => {
    const rows = generateMonthRows(2026, 3) // março/2026 tem 31 dias
    expect(rows).toHaveLength(31)
    expect(rows[0].date).toBe('2026-03-01')
    expect(rows[30].date).toBe('2026-03-31')
  })

  it('pré-preenche dias úteis com 17:30-21:30 e deixa fins de semana vazios', () => {
    const rows = generateMonthRows(2026, 3)
    for (const row of rows) {
      const dow = getWeekdayIndex(row.date)
      if (isWeekend(dow)) {
        expect(row.entrada).toBe('')
        expect(row.saida).toBe('')
      } else {
        expect(row.entrada).toBe('17:30')
        expect(row.saida).toBe('21:30')
      }
    }
  })

  it('deixa em branco também as datas passadas em holidayDates, mesmo em dia útil', () => {
    // 2026-04-21 (terça-feira) é Tiradentes
    const rows = generateMonthRows(2026, 4, new Set(['2026-04-21']))
    const tiradentes = rows.find((r) => r.date === '2026-04-21')
    expect(tiradentes.entrada).toBe('')
    expect(tiradentes.saida).toBe('')
  })

  it('respeita fevereiro bissexto (2028 tem 29 dias)', () => {
    expect(generateMonthRows(2028, 2)).toHaveLength(29)
  })
})

describe('computeRow', () => {
  const jornadaPadraoMinutes = 240 // 04:00

  it('calcula 00:00 de hora extra quando o total é igual à jornada padrão', () => {
    const row = computeRow({ date: '2026-03-02', entrada: '17:30', saida: '21:30' }, jornadaPadraoMinutes)
    expect(row.totalMinutes).toBe(240)
    expect(row.extraMinutes).toBe(0)
    expect(row.weekend).toBe(false)
  })

  it('calcula hora extra positiva quando o total excede a jornada padrão', () => {
    const row = computeRow({ date: '2026-03-02', entrada: '17:30', saida: '22:15' }, jornadaPadraoMinutes)
    expect(row.totalMinutes).toBe(285)
    expect(row.extraMinutes).toBe(45)
  })

  it('nunca retorna saldo negativo quando o total é menor que a jornada padrão', () => {
    const row = computeRow({ date: '2026-03-02', entrada: '17:30', saida: '19:00' }, jornadaPadraoMinutes)
    expect(row.totalMinutes).toBe(90)
    expect(row.extraMinutes).toBe(0)
  })

  it('conta todo o tempo trabalhado em fim de semana como hora extra', () => {
    // 2026-03-07 é sábado
    const row = computeRow({ date: '2026-03-07', entrada: '10:00', saida: '13:00' }, jornadaPadraoMinutes)
    expect(row.weekend).toBe(true)
    expect(row.totalMinutes).toBe(180)
    expect(row.extraMinutes).toBe(180)
  })

  it('retorna 00:00 em fim de semana sem horários preenchidos', () => {
    const row = computeRow({ date: '2026-03-07', entrada: '', saida: '' }, jornadaPadraoMinutes)
    expect(row.totalMinutes).toBe(0)
    expect(row.extraMinutes).toBe(0)
  })

  it('trata um feriado em dia útil como não-trabalhado (mesma regra do fim de semana)', () => {
    // 2026-04-21 (terça-feira) é Tiradentes
    const holidayNames = new Map([['2026-04-21', 'Tiradentes']])
    const row = computeRow({ date: '2026-04-21', entrada: '17:30', saida: '20:00' }, jornadaPadraoMinutes, holidayNames)
    expect(row.weekend).toBe(false)
    expect(row.holidayName).toBe('Tiradentes')
    expect(row.nonWorkingDay).toBe(true)
    expect(row.totalMinutes).toBe(150)
    expect(row.extraMinutes).toBe(150)
  })

  it('não marca holidayName quando a data não está no mapa de feriados', () => {
    const row = computeRow({ date: '2026-03-02', entrada: '17:30', saida: '21:30' }, jornadaPadraoMinutes)
    expect(row.holidayName).toBeNull()
    expect(row.nonWorkingDay).toBe(false)
  })

  it('marca isToday quando a data da linha bate com a data de hoje informada', () => {
    const holidayNames = new Map()
    const today = computeRow({ date: '2026-08-24', entrada: '', saida: '' }, jornadaPadraoMinutes, holidayNames, '2026-08-24')
    expect(today.isToday).toBe(true)

    const otherDay = computeRow({ date: '2026-08-25', entrada: '', saida: '' }, jornadaPadraoMinutes, holidayNames, '2026-08-24')
    expect(otherDay.isToday).toBe(false)
  })

  it('isToday fica false quando nenhuma data de hoje é passada (mês diferente do atual)', () => {
    const row = computeRow({ date: '2026-08-24', entrada: '', saida: '' }, jornadaPadraoMinutes)
    expect(row.isToday).toBe(false)
  })

  it('isToday fica false em fim de semana, mesmo batendo com a data de hoje', () => {
    // 2026-08-22 é um sábado
    const row = computeRow({ date: '2026-08-22', entrada: '', saida: '' }, jornadaPadraoMinutes, new Map(), '2026-08-22')
    expect(row.weekend).toBe(true)
    expect(row.isToday).toBe(false)
  })
})

describe('todayDateKey', () => {
  it('formata a data atual como YYYY-MM-DD', () => {
    expect(todayDateKey(new Date(2026, 7, 24))).toBe('2026-08-24')
  })
})
