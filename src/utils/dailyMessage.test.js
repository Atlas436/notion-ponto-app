import { describe, expect, it } from 'vitest'
import { DAILY_MESSAGES, getDailyMessage } from './dailyMessage'

describe('getDailyMessage', () => {
  it('retorna sempre a mesma frase para o mesmo dia', () => {
    const a = getDailyMessage(new Date(2026, 7, 21, 9, 0))
    const b = getDailyMessage(new Date(2026, 7, 21, 23, 59))
    expect(a).toBe(b)
    expect(DAILY_MESSAGES).toContain(a)
  })

  it('pode variar entre dias diferentes', () => {
    const day1 = getDailyMessage(new Date(2026, 0, 1))
    const day2 = getDailyMessage(new Date(2026, 0, 2))
    // Não é garantido matematicamente que sejam diferentes em todo par de dias,
    // mas para dias consecutivos com a lista atual (24 itens) o índice muda.
    expect(day1).not.toBe(day2)
  })
})
