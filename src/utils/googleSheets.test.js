import { describe, expect, it } from 'vitest'
import { buildFormattingRequests, buildSheetValues, extractSpreadsheetId } from './googleSheets'

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

describe('buildFormattingRequests', () => {
  const computedRows = [
    { weekend: false, holidayName: null, extraMinutes: 45 }, // dia útil, com hora extra
    { weekend: true, holidayName: null, extraMinutes: 180 }, // fim de semana trabalhado
    { weekend: false, holidayName: 'Tiradentes', extraMinutes: 0 }, // feriado, sem horas
    { weekend: false, holidayName: null, extraMinutes: 0 }, // dia normal, nada especial
  ]

  it('começa resetando toda a formatação antes de reaplicar (evita sobra de mês anterior)', () => {
    const requests = buildFormattingRequests(123, computedRows)
    const reset = requests[0].repeatCell
    expect(reset.range).toMatchObject({ sheetId: 123, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 7 })
    expect(reset.cell).toEqual({ userEnteredFormat: {} })
  })

  it('congela as linhas de título + cabeçalho', () => {
    const requests = buildFormattingRequests(123, computedRows)
    const freeze = requests.find((r) => r.updateSheetProperties)
    expect(freeze.updateSheetProperties.properties.gridProperties.frozenRowCount).toBe(4)
  })

  it('aplica fundo de fim de semana e de feriado nas linhas certas, sem misturar', () => {
    const requests = buildFormattingRequests(1, computedRows)
    const bgRequests = requests.filter((r) => r.repeatCell?.cell.userEnteredFormat.backgroundColor && !r.repeatCell.cell.userEnteredFormat.textFormat)

    // linha 0 (dia útil) não deve ganhar cor de fundo
    expect(bgRequests.some((r) => r.repeatCell.range.startRowIndex === 4)).toBe(false)
    // linha 1 (fim de semana) -> índice de linha 5 (firstDataRowIndex=4 + i=1)
    const weekendReq = bgRequests.find((r) => r.repeatCell.range.startRowIndex === 5)
    expect(weekendReq.repeatCell.cell.userEnteredFormat.backgroundColor).toEqual({
      red: 239 / 255,
      green: 243 / 255,
      blue: 233 / 255,
    })
    // linha 2 (feriado) -> índice de linha 6
    const holidayReq = bgRequests.find((r) => r.repeatCell.range.startRowIndex === 6)
    expect(holidayReq).toBeDefined()
    expect(holidayReq.repeatCell.cell.userEnteredFormat.backgroundColor).not.toEqual(
      weekendReq.repeatCell.cell.userEnteredFormat.backgroundColor,
    )
  })

  it('deixa a coluna de horas extras em negrito só nas linhas com extraMinutes > 0', () => {
    const requests = buildFormattingRequests(1, computedRows)
    const extraRequests = requests.filter(
      (r) => r.repeatCell?.range.startColumnIndex === 5 && r.repeatCell.range.endColumnIndex === 6,
    )
    // linhas 0 (45min) e 1 (180min) têm extra > 0 -> 2 requisições; linhas 2 e 3 não têm
    expect(extraRequests).toHaveLength(2)
    expect(extraRequests.map((r) => r.repeatCell.range.startRowIndex).sort()).toEqual([4, 5])
  })
})
