import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncFreelancerToGoogleSheet } from './googleSheets'

const report = {
  spreadsheetId: 'example',
  accessToken: 'test',
  monthName: 'Março',
  year: 2026,
  projects: [
    { id: 'p', name: '=not a formula', billingType: 'hour', rate: 100 },
  ],
  entries: [
    {
      projectId: 'p',
      date: '2026-03-01',
      minutes: 90,
      start: '09:00',
      end: '10:30',
    },
  ],
  payments: [
    {
      projectId: 'p',
      amount: 150,
      months: ['2026-01', '2026-02'],
      minutes: 90,
      status: 'pending',
      dueDate: '2026-03-10',
    },
  ],
}

function mockSheet(
  properties = {
    sheetId: 7,
    title: 'Cozy Freelancer',
    gridProperties: { rowCount: 1000, columnCount: 26 },
  }
) {
  const calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options) => {
      calls.push({
        url,
        options,
        body: options?.body ? JSON.parse(options.body) : null,
      })
      if (url.includes('?fields='))
        return {
          ok: true,
          json: async () => ({ sheets: properties ? [{ properties }] : [] }),
        }
      return {
        ok: true,
        json: async () => ({
          replies: [
            {
              addSheet: {
                properties: {
                  sheetId: 8,
                  gridProperties: { rowCount: 1000, columnCount: 26 },
                },
              },
            },
          ],
        }),
      }
    })
  )
  return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('freelancer Sheets formatting preservation', () => {
  it('writes only values in three fixed blocks, preserving styles and spacer columns', async () => {
    const calls = mockSheet()
    await syncFreelancerToGoogleSheet(report)
    expect(calls).toHaveLength(2)
    const requests = calls[1].body.requests
    expect(requests).toHaveLength(3)
    expect(requests.map((request) => request.updateCells.range)).toEqual([
      { sheetId: 7, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 9 },
      {
        sheetId: 7,
        startRowIndex: 0,
        startColumnIndex: 10,
        endColumnIndex: 17,
      },
      {
        sheetId: 7,
        startRowIndex: 0,
        startColumnIndex: 18,
        endColumnIndex: 25,
      },
    ])
    for (const request of requests)
      expect(request.updateCells.fields).toBe('userEnteredValue')
    expect(requests[0].updateCells.rows[4].values[1].userEnteredValue).toEqual({
      stringValue: '=not a formula',
    })
    expect(requests[1].updateCells.rows[4].values[3].userEnteredValue).toEqual({
      stringValue: '09:00',
    })
    expect(requests[2].updateCells.rows[4].values[1].userEnteredValue).toEqual({
      numberValue: 150,
    })
    expect(JSON.stringify(requests)).not.toContain('userEnteredFormat')
  })
  it('keeps header locations and clears stale values with unbounded ranges on an empty month', async () => {
    const calls = mockSheet()
    await syncFreelancerToGoogleSheet({
      ...report,
      projects: [],
      entries: [],
      payments: [],
    })
    for (const { updateCells } of calls[1].body.requests) {
      expect(updateCells.rows).toHaveLength(4)
      expect(updateCells.range.endRowIndex).toBeUndefined()
      expect(updateCells.rows[3].values.length).toBeGreaterThan(1)
    }
  })
  it('creates the fixed tab only when missing', async () => {
    const calls = mockSheet(null)
    await syncFreelancerToGoogleSheet(report)
    expect(calls[1].body.requests[0].addSheet.properties.title).toBe(
      'Cozy Freelancer'
    )
    expect(calls[2].body.requests[0].updateCells.range.sheetId).toBe(8)
  })
  it('expands a small existing grid without changing any formatting', async () => {
    const calls = mockSheet({
      sheetId: 7,
      title: 'Cozy Freelancer',
      gridProperties: { rowCount: 4, columnCount: 9 },
    })
    await syncFreelancerToGoogleSheet(report)
    expect(calls[1].body.requests.slice(0, 2)).toEqual([
      { appendDimension: { sheetId: 7, dimension: 'ROWS', length: 1 } },
      { appendDimension: { sheetId: 7, dimension: 'COLUMNS', length: 16 } },
    ])
  })
  it('reports permission failures without attempting a write', async () => {
    const fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: { message: 'Sem permissão' } }),
    }))
    vi.stubGlobal('fetch', fetch)
    await expect(syncFreelancerToGoogleSheet(report)).rejects.toThrow(
      'Sem permissão'
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
