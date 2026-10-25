export const monthKey = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`

export function summarizeProjects(projects, entries, payments) {
  const totals = new Map(
    projects.map((project) => [
      project.id,
      { ...project, allMinutes: 0, received: 0 },
    ])
  )
  for (const entry of entries) {
    const project = totals.get(entry.projectId)
    if (project) project.allMinutes += Number(entry.minutes || 0)
  }
  for (const payment of payments) {
    const project = totals.get(payment.projectId)
    if (project && payment.status === 'paid')
      project.received += Number(payment.amount || 0)
  }
  return [...totals.values()].map((project) => {
    const billed =
      project.billingType === 'hour'
        ? (project.allMinutes / 60) * Number(project.rate || 0)
        : Number(project.rate || 0)
    return { ...project, billed, balance: billed - project.received }
  })
}

export function projectMonths(entries, projectId, payments) {
  const months = new Map()
  for (const entry of entries) {
    if (entry.projectId !== projectId) continue
    const key = entry.date.slice(0, 7)
    months.set(key, (months.get(key) || 0) + Number(entry.minutes || 0))
  }
  const billed = new Set(
    payments
      .filter((payment) => payment.projectId === projectId)
      .flatMap((payment) => payment.months || [])
  )
  return [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, minutes]) => ({ month, minutes, billed: billed.has(month) }))
}

export function closingTotal(project, months, selectedMonths) {
  const selected = new Set(selectedMonths)
  const minutes = months
    .filter((month) => selected.has(month.month) && !month.billed)
    .reduce((sum, month) => sum + month.minutes, 0)
  return {
    minutes,
    amount:
      project?.billingType === 'hour'
        ? (minutes / 60) * Number(project.rate || 0)
        : Number(project?.rate || 0),
  }
}

export function monthlyData(projects, entries, payments, prefix) {
  const monthlyEntries = entries.filter((entry) =>
    entry.date.startsWith(prefix)
  )
  const monthlyPayments = payments.filter((payment) =>
    (payment.dueDate || payment.paidAt || '').startsWith(prefix)
  )
  const active = new Set(
    [...monthlyEntries, ...monthlyPayments].map((item) => item.projectId)
  )
  return {
    entries: monthlyEntries,
    payments: monthlyPayments,
    projects: projects.filter(
      (project) => project.monthly || active.has(project.id)
    ),
    minutes: monthlyEntries.reduce(
      (sum, entry) => sum + Number(entry.minutes || 0),
      0
    ),
    received: payments
      .filter(
        (payment) =>
          payment.status === 'paid' && payment.paidAt?.startsWith(prefix)
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    pending: monthlyPayments
      .filter((payment) => payment.status !== 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }
}
