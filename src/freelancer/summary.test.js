import { describe, expect, it } from 'vitest'
import {
  closingTotal,
  duration,
  formatHours,
  hourlyValue,
  monthKey,
  monthlyData,
  projectMonths,
  summarizeProjects,
} from './summary'

const projects = [
  { id: 'p', billingType: 'hour', rate: 120 },
  { id: 'fixed', billingType: 'fixed', rate: 900, monthly: true },
]
const entries = [
  { projectId: 'p', date: '2025-12-31', minutes: 90 },
  { projectId: 'p', date: '2026-01-10', minutes: 120 },
  { projectId: 'p', date: '2026-02-02', minutes: 60 },
]

describe('freelancer monthly history and closing', () => {
  it('uses the selected month and year and preserves the source history', () => {
    expect(monthKey(2025, 12)).toBe('2025-12')
    expect(monthlyData(projects, entries, [], '2025-12').minutes).toBe(90)
    expect(monthlyData(projects, entries, [], '2026-03').entries).toEqual([])
    expect(
      monthlyData(projects, entries, [], '2026-03').projects.map((p) => p.id)
    ).toEqual(['fixed'])
    expect(entries).toHaveLength(3)
  })
  it('sums selected months across years and excludes previously billed months', () => {
    const months = projectMonths(entries, 'p', [
      { projectId: 'p', months: ['2026-01'] },
    ])
    expect(
      closingTotal(projects[0], months, ['2025-12', '2026-01', '2026-02'])
    ).toEqual({ minutes: 150, amount: 300 })
    expect(months[1].billed).toBe(true)
    expect(projectMonths(entries, 'other', [])).toEqual([])
  })
  it('charges a fixed price once for the whole selected period', () => {
    expect(
      closingTotal(projects[1], projectMonths(entries, 'p', []), [
        '2025-12',
        '2026-01',
      ])
    ).toEqual({ minutes: 210, amount: 900 })
  })
  it('separates work months, due dates and actual receipt dates', () => {
    const payments = [
      {
        projectId: 'p',
        amount: 540,
        dueDate: '2026-03-05',
        paidAt: '2026-04-02',
        status: 'paid',
        months: ['2025-12', '2026-01', '2026-02'],
      },
      { projectId: 'p', amount: 100, dueDate: '2026-03-20', status: 'pending' },
    ]
    expect(monthlyData(projects, entries, payments, '2026-03')).toMatchObject({
      minutes: 0,
      received: 0,
      pending: 100,
    })
    expect(monthlyData(projects, entries, payments, '2026-04').received).toBe(
      540
    )
    expect(
      monthlyData(projects, entries, payments, '2026-03').projects
    ).toHaveLength(2)
  })
  it('keeps historical payment records without months usable and totals all projects', () => {
    const payments = [{ projectId: 'p', status: 'paid', amount: 200 }]
    expect(
      projectMonths(entries, 'p', payments).every((item) => !item.billed)
    ).toBe(true)
    expect(summarizeProjects(projects, entries, payments)[0]).toMatchObject({
      allMinutes: 270,
      billed: 540,
      received: 200,
      balance: 340,
    })
  })
})


describe('hourly earnings use exact minutes', () => {
  it('calculates 19:00 to 21:35 at R$25/h as R$64.58, before creating a charge', () => {
    const minutes = duration('19:00', '21:35')
    const project = { id: 'job', billingType: 'hour', rate: 25 }
    const entry = { projectId: 'job', date: '2026-11-01', minutes }
    expect(minutes).toBe(155)
    expect(formatHours(minutes)).toBe('2h 35min')
    expect(hourlyValue(entry, project)).toBeCloseTo(64.5833333333)
    expect(hourlyValue(entry, project).toFixed(2)).toBe('64.58')
    expect(monthlyData([project], [entry], [], '2026-11')).toMatchObject({
      workedValue: hourlyValue(entry, project), pending: 0, received: 0,
    })
    expect(closingTotal(project, projectMonths([entry], project.id, []), ['2026-11']).amount).toBeCloseTo(64.5833333333)
  })
  it('does not count fixed prices, missing projects or other months as hourly earnings', () => {
    const allEntries = [
      ...entries,
      { projectId: 'fixed', date: '2026-01-01', minutes: 60 },
      { projectId: 'removed', date: '2026-01-01', minutes: 60 },
    ]
    expect(monthlyData(projects, allEntries, [], '2026-01').workedValue).toBe(240)
    expect(hourlyValue(allEntries[3], projects[1])).toBeNull()
  })
  it('sums unrounded values and handles overnight shifts', () => {
    const project = { id: 'p', billingType: 'hour', rate: 25 }
    const rows = Array.from({length: 3}, () => ({ projectId: 'p', date: '2026-11-01', minutes: 1 }))
    expect(monthlyData([project], rows, [], '2026-11').workedValue).toBe(1.25)
    expect(duration('23:00', '01:35')).toBe(155)
    expect(duration('', '21:35')).toBe(0)
  })
})
