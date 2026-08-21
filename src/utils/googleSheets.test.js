import { describe, expect, it } from 'vitest'
import { buildSheetValues, extractSpreadsheetId } from './googleSheets'

describe('extractSpreadsheetId', () => {
  it('extrai o ID de um link completo do Google Sheets', () => {
    const link = 'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=0'
    expect(extractSpreadsheetId(link)).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz')
  })

  it('aceita o ID já "puro", sem link', () => {
    expect(extractSpreadsheetId('1AbCdEfGhIjKlMnOpQrStUvWxYz')).toBe('1AbCdEfGhIjKlMnOpQrStUvWxYz')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(extractSpreadsheetId('')).toBe('')
  })
})

describe('buildSheetValues', () => {
  it('monta cabeçalho, linhas e rodapé de totais no formato esperado', () => {
    const computedRows = [
      {
        date: '2026-03-02',
        weekdayLabel: 'Seg',
        holidayName: null,
        entrada: '17:30',
        saida: '21:30',
        totalMinutes: 240,
        extraMinutes: 0,
        descricao: 'Ajustei relatório X',
      },
      {
        date: '2026-03-07',
        weekdayLabel: 'Sáb',
        holidayName: null,
        entrada: '',
        saida: '',
        totalMinutes: 0,
        extraMinutes: 0,
        descricao: '',
      },
    ]

    const values = buildSheetValues({
      colaborador: 'Julia',
      monthName: 'Março',
      ano: 2026,
      computedRows,
      totalMinutes: 240,
      totalExtraMinutes: 0,
    })

    expect(values[0][0]).toBe('Relatório de Ponto — Julia')
    expect(values[3]).toEqual(['Data', 'Dia', 'Entrada', 'Saída', 'Total Trabalhado', 'Horas Extras', 'Descrição / Atividades'])
    expect(values[4]).toEqual(['02/03/2026', 'Seg', '17:30', '21:30', '04:00', '00:00', 'Ajustei relatório X'])
    expect(values[5]).toEqual(['07/03/2026', 'Sáb', '', '', '00:00', '00:00', ''])
    expect(values.at(-1)).toEqual(['', '', '', 'Total do Mês', '04:00', '00:00', ''])
  })

  it('inclui o nome do feriado junto ao dia da semana quando houver', () => {
    const computedRows = [
      {
        date: '2026-04-21',
        weekdayLabel: 'Ter',
        holidayName: 'Tiradentes',
        entrada: '',
        saida: '',
        totalMinutes: 0,
        extraMinutes: 0,
        descricao: '',
      },
    ]
    const values = buildSheetValues({
      colaborador: 'Julia',
      monthName: 'Abril',
      ano: 2026,
      computedRows,
      totalMinutes: 0,
      totalExtraMinutes: 0,
    })
    expect(values[4][1]).toBe('Ter (Tiradentes)')
  })
})
