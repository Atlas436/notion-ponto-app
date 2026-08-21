import { describe, expect, it } from 'vitest'
import { computeEaster, getDefaultHolidays, getMovableNationalHolidays } from './holidays'

describe('computeEaster', () => {
  it('calcula corretamente domingos de Páscoa conhecidos', () => {
    const e2024 = computeEaster(2024)
    expect(e2024.getMonth()).toBe(2) // março (0-indexed)
    expect(e2024.getDate()).toBe(31)

    const e2025 = computeEaster(2025)
    expect(e2025.getMonth()).toBe(3) // abril
    expect(e2025.getDate()).toBe(20)

    const e2026 = computeEaster(2026)
    expect(e2026.getMonth()).toBe(3) // abril
    expect(e2026.getDate()).toBe(5)
  })
})

describe('getMovableNationalHolidays', () => {
  it('calcula Carnaval, Sexta-feira Santa e Corpus Christi de 2024 corretamente', () => {
    const holidays = getMovableNationalHolidays(2024)
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h.date]))

    expect(byName['Carnaval (segunda-feira)']).toBe('2024-02-12')
    expect(byName['Carnaval (terça-feira)']).toBe('2024-02-13')
    expect(byName['Sexta-feira Santa']).toBe('2024-03-29')
    expect(byName['Corpus Christi']).toBe('2024-05-30')
  })
})

describe('getDefaultHolidays', () => {
  it('inclui feriados nacionais fixos e o estadual de SP, todos habilitados', () => {
    const holidays = getDefaultHolidays(2026)
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h]))

    expect(byName['Tiradentes'].date).toBe('2026-04-21')
    expect(byName['Natal'].date).toBe('2026-12-25')
    expect(byName['Revolução Constitucionalista de 1932'].date).toBe('2026-07-09')
    expect(byName['Revolução Constitucionalista de 1932'].scope).toBe('estadual (SP)')

    for (const holiday of holidays) {
      expect(holiday.enabled).toBe(true)
      expect(holiday.custom).toBe(false)
    }
  })

  it('retorna a lista ordenada por data', () => {
    const holidays = getDefaultHolidays(2026)
    const dates = holidays.map((h) => h.date)
    const sorted = [...dates].sort()
    expect(dates).toEqual(sorted)
  })
})
