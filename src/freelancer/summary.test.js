import { describe, expect, it } from 'vitest'
import {
  closingTotal,
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
