import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Download,
  FileText,
  Mail,
  Pencil,
  Plus,
  ReceiptText,
  Send,
  Trash2,
  WalletCards,
} from 'lucide-react'
import {
  monthKey,
  monthlyData,
  summarizeProjects,
  projectMonths,
  closingTotal,
} from './summary'

const KEY = 'cozyPonto.freelancer'
const money = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value || 0)
  )
const hours = (minutes) =>
  (Number(minutes || 0) / 60).toFixed(2).replace('.', ',') + ' h'
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]
  )
const id = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      entries: Array.isArray(saved.entries) ? saved.entries : [],
      payments: Array.isArray(saved.payments) ? saved.payments : [],
    }
  } catch {
    return { projects: [], entries: [], payments: [] }
  }
}
function duration(start, end) {
  const parse = (time) => {
    const [h, m] = (time || '').split(':').map(Number)
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0
  }
  if (!start || !end) return 0
  const initial = parse(start),
    finish = parse(end)
  return finish >= initial ? finish - initial : finish + 1440 - initial
}

export default function FreelancerPanel({
  monthName,
  month,
  year,
  onGoogleSync,
  googleConnected,
  googleStatus,
  autoSync,
}) {
  const prefix = monthKey(year, month)
  const initial = useMemo(loadData, [])
  const [projects, setProjects] = useState(initial.projects)
  const [entries, setEntries] = useState(initial.entries)
  const [payments, setPayments] = useState(initial.payments)
  const [projectForm, setProjectForm] = useState({
    name: '',
    client: '',
    billingType: 'hour',
    rate: '',
    deadline: '',
    monthly: false,
  })
  const [entryForm, setEntryForm] = useState({
    projectId: '',
    date: prefix + '-01',
    start: '',
    end: '',
    description: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    projectId: '',
    amount: '',
    dueDate: '',
    status: 'pending',
  })
  const [closingProjectId, setClosingProjectId] = useState('')
  const [selectedMonths, setSelectedMonths] = useState([])
  const [closingDueDate, setClosingDueDate] = useState('')
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState('')
  const [documentProjectId, setDocumentProjectId] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ projects, entries, payments }))
      setStorageError('')
    } catch {
      setStorageError(
        'Não foi possível salvar no navegador. Exporte seus dados antes de sair.'
      )
    }
  }, [projects, entries, payments])
  useEffect(() => {
    setEntryForm((current) => ({ ...current, date: prefix + '-01' }))
  }, [prefix])
  const monthly = useMemo(
    () => monthlyData(projects, entries, payments, prefix),
    [projects, entries, payments, prefix]
  )
  useEffect(() => {
    if (!autoSync || !googleConnected) return
    const timer = setTimeout(
      () =>
        onGoogleSync({
          projects: monthly.projects,
          entries: monthly.entries,
          payments: monthly.payments,
        }),
      2000
    )
    return () => clearTimeout(timer)
    // onGoogleSync is intentionally omitted: App recreates the callback after each status update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthly, autoSync, googleConnected])

  const summaries = useMemo(
    () => summarizeProjects(projects, entries, payments),
    [projects, entries, payments]
  )
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  )
  const closingProject = projectById.get(closingProjectId)
  const availableMonths = useMemo(
    () => projectMonths(entries, closingProjectId, payments),
    [entries, closingProjectId, payments]
  )
  const closing = closingTotal(closingProject, availableMonths, selectedMonths)
  const selectedDocument = summaries.find(
    (project) => project.id === documentProjectId
  )

  function createClosing(event) {
    event.preventDefault()
    const months = availableMonths
      .filter((item) => selectedMonths.includes(item.month) && !item.billed)
      .map((item) => item.month)
    if (!closingProject || !months.length || !closingDueDate) return
    if (
      closingProject.billingType === 'fixed' &&
      payments.some(
        (payment) =>
          payment.projectId === closingProjectId && payment.months?.length
      )
    ) {
      setNotice(
        'Este projeto de valor fechado já tem um fechamento. Use cobranças e parcelas para dividir o pagamento.'
      )
      return
    }
    setPayments((current) => [
      ...current,
      {
        id: id(),
        projectId: closingProjectId,
        amount: Number(closing.amount.toFixed(2)),
        dueDate: closingDueDate,
        status: 'pending',
        paidAt: '',
        months,
        minutes: closing.minutes,
      },
    ])
    setSelectedMonths([])
    setNotice(
      'Fechamento criado. As horas continuam no histórico e a cobrança aparece no mês do vencimento.'
    )
  }

  async function exportMonth() {
    const { exportFreelancerToExcel } = await import('./exportExcel')
    exportFreelancerToExcel({
      monthName,
      year,
      projects: monthly.projects,
      entries: monthly.entries,
      payments: monthly.payments,
    })
  }

  function addProject(event) {
    event.preventDefault()
    if (!projectForm.name.trim()) return
    if (editingProjectId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProjectId
            ? {
                ...project,
                ...projectForm,
                rate: Number(projectForm.rate || 0),
              }
            : project
        )
      )
      setEditingProjectId(null)
    } else {
      const project = {
        id: id(),
        ...projectForm,
        rate: Number(projectForm.rate || 0),
        status: 'em andamento',
        createdAt: new Date().toISOString(),
      }
      setProjects((current) => [...current, project])
      setEntryForm((current) => ({ ...current, projectId: project.id }))
    }
    setProjectForm({
      name: '',
      client: '',
      billingType: 'hour',
      rate: '',
      deadline: '',
      monthly: false,
    })
  }
  function addEntry(event) {
    event.preventDefault()
    if (
      !entryForm.projectId ||
      !entryForm.date ||
      !entryForm.start ||
      !entryForm.end
    )
      return
    if (!entryForm.date.startsWith(prefix)) {
      setNotice('Escolha uma data dentro do mês selecionado.')
      return
    }
    if (
      payments.some(
        (payment) =>
          payment.projectId === entryForm.projectId &&
          payment.months?.includes(prefix)
      )
    ) {
      setNotice(
        'Este mês já foi fechado para o projeto. Exclua o fechamento para ajustar as horas.'
      )
      return
    }
    setEntries((current) => [
      ...current,
      {
        id: id(),
        ...entryForm,
        minutes: duration(entryForm.start, entryForm.end),
      },
    ])
    setEntryForm((current) => ({
      ...current,
      start: '',
      end: '',
      description: '',
    }))
  }
  function addPayment(event) {
    event.preventDefault()
    if (!paymentForm.projectId || !paymentForm.amount) return
    setPayments((current) => [
      ...current,
      {
        id: id(),
        ...paymentForm,
        amount: Number(paymentForm.amount),
        paidAt:
          paymentForm.status === 'paid'
            ? new Date().toLocaleDateString('sv-SE')
            : '',
      },
    ])
    setPaymentForm({
      projectId: '',
      amount: '',
      dueDate: '',
      status: 'pending',
    })
  }
  function editProject(project) {
    setProjectForm({
      name: project.name,
      client: project.client || '',
      billingType: project.billingType,
      rate: project.rate || '',
      deadline: project.deadline || '',
      monthly: Boolean(project.monthly),
    })
    setEditingProjectId(project.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function cancelEdit() {
    setProjectForm({
      name: '',
      client: '',
      billingType: 'hour',
      rate: '',
      deadline: '',
      monthly: false,
    })
    setEditingProjectId(null)
  }
  function changeStatus(projectId, status) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, status } : project
      )
    )
  }
  function removeProject(project) {
    const projectEntries = entries.filter(
      (entry) => entry.projectId === project.id
    ).length
    const projectPayments = payments.filter(
      (payment) => payment.projectId === project.id
    ).length
    const details = [
      projectEntries ? projectEntries + ' apontamento(s) de hora' : '',
      projectPayments ? projectPayments + ' cobrança(s)' : '',
    ]
      .filter(Boolean)
      .join(' e ')
    const confirmed = window.confirm(
      'Excluir o projeto “' +
        project.name +
        '”?\n\n' +
        (details ? 'Também serão excluídos: ' + details + '.\n\n' : '') +
        'Esta ação não pode ser desfeita.'
    )
    if (!confirmed) return
    setProjects((current) => current.filter((item) => item.id !== project.id))
    setEntries((current) =>
      current.filter((entry) => entry.projectId !== project.id)
    )
    setPayments((current) =>
      current.filter((payment) => payment.projectId !== project.id)
    )
    setEntryForm((current) =>
      current.projectId === project.id ? { ...current, projectId: '' } : current
    )
    setPaymentForm((current) =>
      current.projectId === project.id ? { ...current, projectId: '' } : current
    )
    if (documentProjectId === project.id) setDocumentProjectId('')
  }
  function sendEmail() {
    if (!selectedDocument) return
    const subject = encodeURIComponent('Projeto ' + selectedDocument.name)
    const body = encodeURIComponent(
      'Olá,\n\nSegue o resumo do projeto ' +
        selectedDocument.name +
        '.\n\nValor: ' +
        money(selectedDocument.billed) +
        '\nHoras registradas: ' +
        hours(selectedDocument.allMinutes) +
        '\n\nEnviado pelo Cozy Freelancer.'
    )
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body
  }
  function printDocument(type) {
    if (!selectedDocument) return
    const popup = window.open('', '_blank', 'width=800,height=700')
    if (!popup) return
    const title = type === 'proposal' ? 'Proposta comercial' : 'Recibo'
    const value =
      type === 'proposal' ? selectedDocument.billed : selectedDocument.received
    popup.document.write(
      '<!doctype html><html><head><title>' +
        title +
        '</title><style>body{font-family:Arial;padding:48px;color:#453c4e}h1{color:#7c5cbf}.box{border:1px solid #ddd;border-radius:12px;padding:24px;margin-top:32px}</style></head><body><h1>Cozy Freelancer</h1><h2>' +
        title +
        '</h2><div class="box"><p><b>Cliente:</b> ' +
        escapeHtml(selectedDocument.client || '—') +
        '</p><p><b>Projeto:</b> ' +
        escapeHtml(selectedDocument.name) +
        '</p><p><b>Valor:</b> ' +
        money(value) +
        '</p><p><b>Data:</b> ' +
        new Date().toLocaleDateString('pt-BR') +
        '</p></div><p>Documento gerado pelo Cozy Freelancer.</p><script>window.print()</script></body></html>'
    )
    popup.document.close()
  }

  return (
    <section className="freelancer-workspace space-y-6">
      {storageError && (
        <p role="alert" className="rounded-xl border border-red-400 p-4">
          {storageError}
        </p>
      )}
      <div className="freelancer-hero rounded-3xl border border-cozy-border p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cozy-accent">
          Seu estúdio · visão mensal
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {monthName}{' '}
          <span className="font-normal text-cozy-muted">{year}</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-cozy-muted">
          Mude o mês no cabeçalho para navegar pelo seu trabalho. Um mês novo
          começa sem apontamentos; seu histórico e seus projetos ficam
          guardados.
        </p>
      </div>
      <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cozy-text">
              <BriefcaseBusiness size={21} /> Cozy Freelancer
            </h2>
            <p className="mt-1 text-sm text-cozy-muted">
              Seu trabalho tem história. Cada mês, um novo capítulo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportMonth}
              className="flex items-center gap-1 rounded-xl bg-cozy-sage px-3 py-2 text-sm font-medium text-white"
            >
              <Download size={15} /> Excel
            </button>
            <button
              disabled={!googleConnected}
              onClick={() =>
                onGoogleSync({
                  projects: monthly.projects,
                  entries: monthly.entries,
                  payments: monthly.payments,
                })
              }
              className="flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Send size={15} />{' '}
              {googleStatus === 'syncing' ? 'Sincronizando' : 'Google Sheets'}
            </button>
          </div>
        </div>
        {!googleConnected && (
          <p className="mt-3 text-xs text-cozy-muted">
            Conecte o Google Sheets no cabeçalho para sincronizar a aba separada
            “Cozy Freelancer”.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Horas neste mês', hours(monthly.minutes)],
          ['Projetos ativos no mês', monthly.projects.length],
          ['A receber · vencimento no mês', money(monthly.pending)],
          ['Recebido neste mês', money(monthly.received)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-cozy-border bg-cozy-panel p-4"
          >
            <p className="text-xs text-cozy-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold text-cozy-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={addProject}
          className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"
        >
          <h3 className="font-semibold text-cozy-text">
            {editingProjectId ? 'Editar projeto' : 'Novo projeto'}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Nome do projeto"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              placeholder="Cliente"
              value={projectForm.client}
              onChange={(e) =>
                setProjectForm({ ...projectForm, client: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <select
              value={projectForm.billingType}
              onChange={(e) =>
                setProjectForm({ ...projectForm, billingType: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            >
              <option value="hour">Por hora</option>
              <option value="fixed">Valor fechado</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={
                projectForm.billingType === 'hour'
                  ? 'Valor por hora (R$)'
                  : 'Valor do projeto (R$)'
              }
              value={projectForm.rate}
              onChange={(e) =>
                setProjectForm({ ...projectForm, rate: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={projectForm.deadline}
              onChange={(e) =>
                setProjectForm({ ...projectForm, deadline: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-cozy-text">
              <input
                type="checkbox"
                checked={projectForm.monthly}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, monthly: e.target.checked })
                }
              />{' '}
              Projeto mensal/recorrente
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white">
              {editingProjectId ? <Pencil size={15} /> : <Plus size={15} />}{' '}
              {editingProjectId ? 'Salvar alterações' : 'Criar projeto'}
            </button>
            {editingProjectId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-cozy-border px-3 py-2 text-sm text-cozy-text"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <form
          onSubmit={addEntry}
          className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"
        >
          <h3 className="font-semibold text-cozy-text">Apontar horas</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              required
              value={entryForm.projectId}
              onChange={(e) =>
                setEntryForm({ ...entryForm, projectId: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            >
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.client ? project.client + ' — ' : ''}
                  {project.name}
                </option>
              ))}
            </select>
            <input
              required
              aria-label="Data do apontamento"
              type="date"
              min={prefix + '-01'}
              max={prefix + '-' + new Date(year, month, 0).getDate()}
              value={entryForm.date}
              onChange={(e) =>
                setEntryForm({ ...entryForm, date: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Início da atividade"
              type="time"
              value={entryForm.start}
              onChange={(e) =>
                setEntryForm({ ...entryForm, start: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Fim da atividade"
              type="time"
              value={entryForm.end}
              onChange={(e) =>
                setEntryForm({ ...entryForm, end: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              placeholder="Atividade/tarefa"
              value={entryForm.description}
              onChange={(e) =>
                setEntryForm({ ...entryForm, description: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button className="mt-4 flex items-center gap-1 rounded-xl bg-cozy-sage px-3 py-2 text-sm font-medium text-white">
            <Plus size={15} /> Registrar horas
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5 overflow-x-auto">
        <h3 className="font-semibold text-cozy-text">
          Projetos · histórico completo
        </h3>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-cozy-border text-xs text-cozy-muted">
            <tr>
              <th className="pb-2">Projeto</th>
              <th>Tipo</th>
              <th>Horas</th>
              <th>Valor total</th>
              <th>Recebido</th>
              <th>Prazo</th>
              <th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((project) => (
              <tr key={project.id} className="border-b border-cozy-border/60">
                <td className="py-3">
                  <p className="font-medium text-cozy-text">{project.name}</p>
                  <p className="text-xs text-cozy-muted">
                    {project.client || 'Sem cliente'}
                  </p>
                </td>
                <td>{project.monthly ? 'Mensal' : 'Avulso'}</td>
                <td>{hours(project.allMinutes)}</td>
                <td>{money(project.billed)}</td>
                <td>{money(project.received)}</td>
                <td>{project.deadline || '—'}</td>
                <td>
                  <select
                    value={project.status}
                    onChange={(e) => changeStatus(project.id, e.target.value)}
                    className="rounded-lg border border-cozy-border bg-white px-2 py-1 text-xs"
                  >
                    <option>orçamento</option>
                    <option>em andamento</option>
                    <option>aguardando cliente</option>
                    <option>entregue</option>
                    <option>pago</option>
                  </select>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => editProject(project)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cozy-accent hover:bg-cozy-accent/10"
                    title={'Editar ' + project.name}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProject(project)}
                    className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    title={'Excluir ' + project.name}
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5">
        <h3 className="font-semibold">Apontamentos · {monthName}</h3>
        {!monthly.entries.length && (
          <p className="py-8 text-center text-sm text-cozy-muted">
            Um mês em branco, pronto para suas próximas ideias. Registre suas
            primeiras horas acima.
          </p>
        )}
        <div className="mt-3 max-h-80 space-y-2 overflow-auto">
          {monthly.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cozy-bg p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {projectById.get(entry.projectId)?.name || 'Projeto removido'}{' '}
                  · {entry.date.split('-').reverse().join('/')}
                </p>
                <p className="text-xs text-cozy-muted">
                  {entry.start}–{entry.end} ·{' '}
                  {entry.description || 'Sem descrição'}
                </p>
              </div>
              <span className="font-medium text-cozy-accent">
                {hours(entry.minutes)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={createClosing}
        className="closing-panel rounded-2xl border border-cozy-accent/30 bg-cozy-panel p-5 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-cozy-accent">
          Do trabalho ao pagamento
        </p>
        <h3 className="mt-1 text-xl font-semibold">Fechar um período</h3>
        <p className="mt-2 text-sm text-cozy-muted">
          Trabalhou três meses e vai receber tudo junto? Escolha o projeto e os
          meses para somar as horas em uma cobrança.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Projeto
            <select
              required
              aria-label="Projeto do fechamento"
              value={closingProjectId}
              onChange={(event) => {
                setClosingProjectId(event.target.value)
                setSelectedMonths([])
                setNotice('')
              }}
              className="mt-1 w-full rounded-xl border border-cozy-border p-3"
            >
              <option value="">Selecione um projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Vencimento da cobrança
            <input
              required
              type="date"
              value={closingDueDate}
              onChange={(event) => setClosingDueDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-cozy-border p-3"
            />
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium">
            Meses trabalhados
          </legend>
          <div className="flex flex-wrap gap-2">
            {availableMonths.map((item) => (
              <label
                key={item.month}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${selectedMonths.includes(item.month) ? 'border-cozy-accent bg-cozy-accent/10' : 'border-cozy-border'} ${item.billed ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  disabled={item.billed}
                  checked={selectedMonths.includes(item.month)}
                  onChange={(event) =>
                    setSelectedMonths((current) =>
                      event.target.checked
                        ? [...current, item.month]
                        : current.filter((value) => value !== item.month)
                    )
                  }
                />
                <span>
                  {item.month.split('-').reverse().join('/')} ·{' '}
                  {hours(item.minutes)}
                  {item.billed && ' · fechado'}
                </span>
              </label>
            ))}
          </div>
          {!availableMonths.length && (
            <p className="text-sm text-cozy-muted">
              {closingProject
                ? 'Este projeto ainda não tem horas registradas.'
                : 'Selecione um projeto para ver os meses com horas registradas.'}
            </p>
          )}
        </fieldset>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-cozy-border pt-4">
          <div>
            <p className="text-xs text-cozy-muted">
              Total selecionado · {hours(closing.minutes)}
            </p>
            <p className="text-2xl font-semibold">{money(closing.amount)}</p>
            {closingProject?.billingType === 'fixed' && (
              <p className="text-xs text-cozy-muted">
                Valor fechado do projeto, cobrado uma única vez.
              </p>
            )}
          </div>
          <button
            disabled={!selectedMonths.length || !closingProject}
            className="rounded-xl bg-cozy-accent px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Gerar cobrança do período
          </button>
        </div>
      </form>
      {payments.some((payment) => !payment.dueDate) && (
        <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5">
          <h3 className="font-semibold">Cobranças antigas sem vencimento</h3>
          <p className="mt-1 text-sm text-cozy-muted">
            Escolha uma data para incluí-las no controle mensal.
          </p>
          {payments
            .filter((payment) => !payment.dueDate)
            .map((payment) => (
              <label
                key={payment.id}
                className="mt-3 flex flex-wrap items-center gap-3 text-sm"
              >
                {projectById.get(payment.projectId)?.name} ·{' '}
                {money(payment.amount)}
                <input
                  aria-label="Definir vencimento da cobrança antiga"
                  type="date"
                  className="rounded-lg border border-cozy-border p-2"
                  onChange={(event) =>
                    setPayments((current) =>
                      current.map((item) =>
                        item.id === payment.id
                          ? { ...item, dueDate: event.target.value }
                          : item
                      )
                    )
                  }
                />
              </label>
            ))}
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-cozy-accent/10 p-4 text-sm">
          {notice}
        </p>
      )}

      <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5">
        <h3 className="font-semibold">
          Cobranças · vencimentos de {monthName}
        </h3>
        <p className="mt-1 text-xs text-cozy-muted">
          As horas ficam no mês trabalhado. O pagamento aparece no mês em que
          foi recebido.
        </p>
        {!monthly.payments.length && (
          <p className="py-5 text-sm text-cozy-muted">
            Nenhuma cobrança vence neste mês.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {monthly.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cozy-bg p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {projectById.get(payment.projectId)?.name ||
                    'Projeto removido'}{' '}
                  · {money(payment.amount)}
                </p>
                <p className="text-xs text-cozy-muted">
                  Vence em {payment.dueDate || '—'}
                  {payment.months?.length
                    ? ' · ' +
                      payment.months
                        .map((value) => value.split('-').reverse().join('/'))
                        .join(', ') +
                      ' · ' +
                      hours(payment.minutes)
                    : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPayments((current) =>
                      current.map((item) =>
                        item.id === payment.id
                          ? {
                              ...item,
                              status:
                                item.status === 'paid' ? 'pending' : 'paid',
                              paidAt:
                                item.status === 'paid'
                                  ? ''
                                  : new Date().toLocaleDateString('sv-SE'),
                            }
                          : item
                      )
                    )
                  }
                  className="rounded-lg border border-cozy-border px-3 py-2"
                >
                  {payment.status === 'paid'
                    ? 'Recebido ✓ · desfazer'
                    : 'Marcar recebido'}
                </button>
                <button
                  type="button"
                  aria-label="Excluir cobrança"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Excluir esta cobrança? Os apontamentos de horas serão preservados.'
                      )
                    )
                      setPayments((current) =>
                        current.filter((item) => item.id !== payment.id)
                      )
                  }}
                  className="rounded-lg p-2 text-cozy-muted"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={addPayment}
          className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"
        >
          <h3 className="flex items-center gap-2 font-semibold text-cozy-text">
            <WalletCards size={18} /> Cobranças e parcelas
          </h3>
          <p className="mt-1 text-xs text-cozy-muted">
            Adicione cada parcela separadamente para acompanhar o que falta
            receber.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              required
              value={paymentForm.projectId}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, projectId: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            >
              <option value="">Projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor (R$)"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <input
              required
              aria-label="Vencimento da parcela"
              type="date"
              value={paymentForm.dueDate}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, dueDate: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            />
            <select
              value={paymentForm.status}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, status: e.target.value })
              }
              className="rounded-xl border border-cozy-border px-3 py-2 text-sm"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Recebido</option>
            </select>
          </div>
          <button className="mt-4 flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white">
            <Plus size={15} /> Adicionar cobrança
          </button>
        </form>
        <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5">
          <h3 className="font-semibold text-cozy-text">Proposta e recibo</h3>
          <p className="mt-1 text-xs text-cozy-muted">
            Gera uma versão limpa para imprimir ou salvar como PDF no navegador.
          </p>
          <select
            value={documentProjectId}
            onChange={(e) => setDocumentProjectId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-cozy-border px-3 py-2 text-sm"
          >
            <option value="">Escolha um projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <button
              disabled={!selectedDocument}
              onClick={() => printDocument('proposal')}
              className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <FileText size={15} /> Proposta
            </button>
            <button
              disabled={!selectedDocument}
              onClick={() => printDocument('receipt')}
              className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <ReceiptText size={15} /> Recibo
            </button>
            <button
              disabled={!selectedDocument}
              onClick={sendEmail}
              className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"
            >
              <Mail size={15} /> E-mail
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
