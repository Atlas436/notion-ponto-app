import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Download, FileText, Mail, Plus, ReceiptText, Send, Trash2, WalletCards } from 'lucide-react'
import { exportFreelancerToExcel } from './exportExcel'

const KEY = 'cozyPonto.freelancer'
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const hours = (minutes) => (Number(minutes || 0) / 60).toFixed(2).replace('.', ',') + ' h'
const id = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { projects: Array.isArray(saved.projects) ? saved.projects : [], entries: Array.isArray(saved.entries) ? saved.entries : [], payments: Array.isArray(saved.payments) ? saved.payments : [] }
  } catch { return { projects: [], entries: [], payments: [] } }
}
function duration(start, end) {
  const parse = (time) => { const [h, m] = (time || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0 }
  if (!start || !end) return 0
  const initial = parse(start), finish = parse(end)
  return finish >= initial ? finish - initial : finish + 1440 - initial
}

export default function FreelancerPanel({ monthName, year, onGoogleSync, googleConnected, googleStatus, autoSync }) {
  const initial = useMemo(loadData, [])
  const [projects, setProjects] = useState(initial.projects)
  const [entries, setEntries] = useState(initial.entries)
  const [payments, setPayments] = useState(initial.payments)
  const [projectForm, setProjectForm] = useState({ name: '', client: '', billingType: 'hour', rate: '', deadline: '', monthly: false })
  const [entryForm, setEntryForm] = useState({ projectId: '', date: year + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'), start: '', end: '', description: '' })
  const [paymentForm, setPaymentForm] = useState({ projectId: '', amount: '', dueDate: '', status: 'pending' })
  const [documentProjectId, setDocumentProjectId] = useState('')

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify({ projects, entries, payments })) }, [projects, entries, payments])
  const prefix = year + '-' + String(new Date().getMonth() + 1).padStart(2, '0')
  useEffect(() => {
    if (!autoSync || !googleConnected) return
    const timer = setTimeout(() => onGoogleSync({ projects, entries, payments }), 2000)
    return () => clearTimeout(timer)
    // onGoogleSync is intentionally omitted: App recreates the callback after each status update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, entries, payments, autoSync, googleConnected])

  const monthlyEntries = entries.filter((entry) => entry.date.startsWith(prefix))
  const monthlyProjects = projects.filter((project) => project.monthly || monthlyEntries.some((entry) => entry.projectId === project.id))
  const summaries = projects.map((project) => {
    const allMinutes = entries.filter((entry) => entry.projectId === project.id).reduce((sum, entry) => sum + Number(entry.minutes || 0), 0)
    const monthMinutes = monthlyEntries.filter((entry) => entry.projectId === project.id).reduce((sum, entry) => sum + Number(entry.minutes || 0), 0)
    const billed = project.billingType === 'hour' ? allMinutes / 60 * Number(project.rate || 0) : Number(project.rate || 0)
    const received = payments.filter((payment) => payment.projectId === project.id && payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    return { ...project, allMinutes, monthMinutes, billed, received, balance: billed - received }
  })
  const totalBilled = summaries.reduce((sum, project) => sum + project.billed, 0)
  const totalReceived = summaries.reduce((sum, project) => sum + project.received, 0)
  const selectedDocument = summaries.find((project) => project.id === documentProjectId)

  function addProject(event) {
    event.preventDefault()
    if (!projectForm.name.trim()) return
    const project = { id: id(), ...projectForm, rate: Number(projectForm.rate || 0), status: 'em andamento', createdAt: new Date().toISOString() }
    setProjects((current) => [...current, project])
    setProjectForm({ name: '', client: '', billingType: 'hour', rate: '', deadline: '', monthly: false })
    setEntryForm((current) => ({ ...current, projectId: project.id }))
  }
  function addEntry(event) {
    event.preventDefault()
    if (!entryForm.projectId || !entryForm.date || !entryForm.start || !entryForm.end) return
    setEntries((current) => [...current, { id: id(), ...entryForm, minutes: duration(entryForm.start, entryForm.end) }])
    setEntryForm((current) => ({ ...current, start: '', end: '', description: '' }))
  }
  function addPayment(event) {
    event.preventDefault()
    if (!paymentForm.projectId || !paymentForm.amount) return
    setPayments((current) => [...current, { id: id(), ...paymentForm, amount: Number(paymentForm.amount), paidAt: paymentForm.status === 'paid' ? new Date().toISOString().slice(0, 10) : '' }])
    setPaymentForm({ projectId: '', amount: '', dueDate: '', status: 'pending' })
  }
  function changeStatus(projectId, status) { setProjects((current) => current.map((project) => project.id === projectId ? { ...project, status } : project)) }
  function removeProject(project) {
    const projectEntries = entries.filter((entry) => entry.projectId === project.id).length
    const projectPayments = payments.filter((payment) => payment.projectId === project.id).length
    const details = [projectEntries ? projectEntries + ' apontamento(s) de hora' : '', projectPayments ? projectPayments + ' cobrança(s)' : ''].filter(Boolean).join(' e ')
    const confirmed = window.confirm('Excluir o projeto “' + project.name + '”?\n\n' + (details ? 'Também serão excluídos: ' + details + '.\n\n' : '') + 'Esta ação não pode ser desfeita.')
    if (!confirmed) return
    setProjects((current) => current.filter((item) => item.id !== project.id))
    setEntries((current) => current.filter((entry) => entry.projectId !== project.id))
    setPayments((current) => current.filter((payment) => payment.projectId !== project.id))
    setEntryForm((current) => current.projectId === project.id ? { ...current, projectId: '' } : current)
    setPaymentForm((current) => current.projectId === project.id ? { ...current, projectId: '' } : current)
    if (documentProjectId === project.id) setDocumentProjectId('')
  }
  function sendEmail() {
    if (!selectedDocument) return
    const subject = encodeURIComponent('Projeto ' + selectedDocument.name)
    const body = encodeURIComponent('Olá,\n\nSegue o resumo do projeto ' + selectedDocument.name + '.\n\nValor: ' + money(selectedDocument.billed) + '\nHoras registradas: ' + hours(selectedDocument.allMinutes) + '\n\nEnviado pelo Cozy Freelancer.')
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body
  }
  function printDocument(type) {
    if (!selectedDocument) return
    const popup = window.open('', '_blank', 'width=800,height=700')
    if (!popup) return
    const title = type === 'proposal' ? 'Proposta comercial' : 'Recibo'
    const value = type === 'proposal' ? selectedDocument.billed : selectedDocument.received
    popup.document.write('<!doctype html><html><head><title>' + title + '</title><style>body{font-family:Arial;padding:48px;color:#453c4e}h1{color:#7c5cbf}.box{border:1px solid #ddd;border-radius:12px;padding:24px;margin-top:32px}</style></head><body><h1>Cozy Freelancer</h1><h2>' + title + '</h2><div class="box"><p><b>Cliente:</b> ' + (selectedDocument.client || '—') + '</p><p><b>Projeto:</b> ' + selectedDocument.name + '</p><p><b>Valor:</b> ' + money(value) + '</p><p><b>Data:</b> ' + new Date().toLocaleDateString('pt-BR') + '</p></div><p>Documento gerado pelo Cozy Freelancer.</p><script>window.print()<\/script></body></html>')
    popup.document.close()
  }

  return <section className="space-y-6">
    <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-semibold text-cozy-text"><BriefcaseBusiness size={21}/> Cozy Freelancer</h2><p className="mt-1 text-sm text-cozy-muted">Projetos, horas, cobranças e documentos em um só lugar.</p></div><div className="flex gap-2"><button onClick={() => exportFreelancerToExcel({ monthName, year, projects, entries, payments })} className="flex items-center gap-1 rounded-xl bg-cozy-sage px-3 py-2 text-sm font-medium text-white"><Download size={15}/> Excel</button><button disabled={!googleConnected} onClick={() => onGoogleSync({ projects, entries, payments })} className="flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Send size={15}/> {googleStatus === 'syncing' ? 'Sincronizando' : 'Google Sheets'}</button></div></div>
      {!googleConnected && <p className="mt-3 text-xs text-cozy-muted">Conecte o Google Sheets no cabeçalho para sincronizar a aba separada “Cozy Freelancer”.</p>}
    </div>

    <div className="grid gap-3 sm:grid-cols-4">
      {[['Horas neste mês', hours(monthlyEntries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0))], ['Projetos mensais', monthlyProjects.length], ['A cobrar', money(totalBilled - totalReceived)], ['Recebido', money(totalReceived)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-cozy-border bg-cozy-panel p-4"><p className="text-xs text-cozy-muted">{label}</p><p className="mt-1 text-xl font-semibold text-cozy-text">{value}</p></div>)}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={addProject} className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"><h3 className="font-semibold text-cozy-text">Novo projeto</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><input required placeholder="Nome do projeto" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm,name:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input placeholder="Cliente" value={projectForm.client} onChange={(e) => setProjectForm({...projectForm,client:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><select value={projectForm.billingType} onChange={(e) => setProjectForm({...projectForm,billingType:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"><option value="hour">Por hora</option><option value="fixed">Valor fechado</option></select><input type="number" min="0" step="0.01" placeholder={projectForm.billingType === 'hour' ? 'Valor por hora (R$)' : 'Valor do projeto (R$)'} value={projectForm.rate} onChange={(e) => setProjectForm({...projectForm,rate:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({...projectForm,deadline:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><label className="flex items-center gap-2 text-sm text-cozy-text"><input type="checkbox" checked={projectForm.monthly} onChange={(e) => setProjectForm({...projectForm,monthly:e.target.checked})}/> Projeto mensal/recorrente</label></div><button className="mt-4 flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white"><Plus size={15}/> Criar projeto</button></form>

      <form onSubmit={addEntry} className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"><h3 className="font-semibold text-cozy-text">Apontar horas</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><select required value={entryForm.projectId} onChange={(e) => setEntryForm({...entryForm,projectId:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"><option value="">Selecione um projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.client ? project.client + ' — ' : ''}{project.name}</option>)}</select><input required type="date" value={entryForm.date} onChange={(e) => setEntryForm({...entryForm,date:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input required type="time" value={entryForm.start} onChange={(e) => setEntryForm({...entryForm,start:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input required type="time" value={entryForm.end} onChange={(e) => setEntryForm({...entryForm,end:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input placeholder="Atividade/tarefa" value={entryForm.description} onChange={(e) => setEntryForm({...entryForm,description:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm sm:col-span-2"/></div><button className="mt-4 flex items-center gap-1 rounded-xl bg-cozy-sage px-3 py-2 text-sm font-medium text-white"><Plus size={15}/> Registrar horas</button></form>
    </div>

    <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5 overflow-x-auto"><h3 className="font-semibold text-cozy-text">Projetos e financeiro</h3><table className="mt-4 w-full min-w-[760px] text-left text-sm"><thead className="border-b border-cozy-border text-xs text-cozy-muted"><tr><th className="pb-2">Projeto</th><th>Tipo</th><th>Horas</th><th>A cobrar</th><th>Recebido</th><th>Prazo</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>{summaries.map((project) => <tr key={project.id} className="border-b border-cozy-border/60"><td className="py-3"><p className="font-medium text-cozy-text">{project.name}</p><p className="text-xs text-cozy-muted">{project.client || 'Sem cliente'}</p></td><td>{project.monthly ? 'Mensal' : 'Avulso'}</td><td>{hours(project.allMinutes)} <span className="text-xs text-cozy-muted">({hours(project.monthMinutes)} mês)</span></td><td>{money(project.billed)}</td><td>{money(project.received)}</td><td>{project.deadline || '—'}</td><td><select value={project.status} onChange={(e) => changeStatus(project.id,e.target.value)} className="rounded-lg border border-cozy-border bg-white px-2 py-1 text-xs"><option>orçamento</option><option>em andamento</option><option>aguardando cliente</option><option>entregue</option><option>pago</option></select></td><td className="text-right"><button type="button" onClick={() => removeProject(project)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50" title={'Excluir ' + project.name}><Trash2 size={14}/> Excluir</button></td></tr>)}</tbody></table></div>

    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={addPayment} className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"><h3 className="flex items-center gap-2 font-semibold text-cozy-text"><WalletCards size={18}/> Cobranças e parcelas</h3><p className="mt-1 text-xs text-cozy-muted">Adicione cada parcela separadamente para acompanhar o que falta receber.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><select required value={paymentForm.projectId} onChange={(e) => setPaymentForm({...paymentForm,projectId:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"><option value="">Projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><input required type="number" min="0" step="0.01" placeholder="Valor (R$)" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm,amount:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm({...paymentForm,dueDate:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"/><select value={paymentForm.status} onChange={(e) => setPaymentForm({...paymentForm,status:e.target.value})} className="rounded-xl border border-cozy-border px-3 py-2 text-sm"><option value="pending">Pendente</option><option value="paid">Recebido</option></select></div><button className="mt-4 flex items-center gap-1 rounded-xl bg-cozy-accent px-3 py-2 text-sm font-medium text-white"><Plus size={15}/> Adicionar cobrança</button></form>
      <div className="rounded-2xl border border-cozy-border bg-cozy-panel p-5"><h3 className="font-semibold text-cozy-text">Proposta e recibo</h3><p className="mt-1 text-xs text-cozy-muted">Gera uma versão limpa para imprimir ou salvar como PDF no navegador.</p><select value={documentProjectId} onChange={(e) => setDocumentProjectId(e.target.value)} className="mt-3 w-full rounded-xl border border-cozy-border px-3 py-2 text-sm"><option value="">Escolha um projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><div className="mt-3 flex gap-2"><button disabled={!selectedDocument} onClick={() => printDocument('proposal')} className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"><FileText size={15}/> Proposta</button><button disabled={!selectedDocument} onClick={() => printDocument('receipt')} className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"><ReceiptText size={15}/> Recibo</button><button disabled={!selectedDocument} onClick={sendEmail} className="flex items-center gap-1 rounded-xl border border-cozy-border px-3 py-2 text-sm disabled:opacity-50"><Mail size={15}/> E-mail</button></div></div>
    </div>
  </section>
}