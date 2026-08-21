import { useState } from 'react'
import { CheckCircle2, Link as LinkIcon, Loader2, RefreshCw, XCircle } from 'lucide-react'

export default function GoogleSheetsPanel({
  clientId,
  onClientIdChange,
  spreadsheetLink,
  onSpreadsheetLinkChange,
  autoSync,
  onAutoSyncChange,
  connected,
  status,
  lastSyncedAt,
  errorMessage,
  onConnect,
  onSyncNow,
}) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="no-print mb-6 rounded-2xl border border-cozy-border bg-cozy-panel p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-cozy-text">Sincronizar com Google Sheets</h2>
      <p className="mt-1 text-xs text-cozy-muted">
        Manda uma cópia deste mês pra uma planilha do Google que você já compartilhou com quem precisar ver — ela
        acompanha ao vivo direto no Google Sheets, sem precisar abrir o Cozy Ponto. Isso é opcional: sem configurar
        nada aqui, seus dados continuam só no seu navegador.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-cozy-muted">Client ID do Google</span>
          <input
            type="text"
            value={clientId}
            onChange={(e) => onClientIdChange(e.target.value)}
            placeholder="xxxxxxxx.apps.googleusercontent.com"
            className="w-72 rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-cozy-muted">Link ou ID da planilha</span>
          <input
            type="text"
            value={spreadsheetLink}
            onChange={(e) => onSpreadsheetLinkChange(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full rounded-lg border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm text-cozy-text shadow-sm outline-none focus:border-cozy-accent focus:ring-2 focus:ring-cozy-accent/20"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          disabled={status === 'connecting'}
          className="flex items-center gap-1.5 rounded-xl border border-cozy-border bg-cozy-panel px-3 py-1.5 text-sm font-medium text-cozy-text shadow-sm transition-colors hover:bg-cozy-weekend disabled:opacity-60"
        >
          {status === 'connecting' ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
          {connected ? 'Reconectar com Google' : 'Conectar com Google'}
        </button>

        <button
          type="button"
          onClick={onSyncNow}
          disabled={!connected || status === 'syncing'}
          className="flex items-center gap-1.5 rounded-xl bg-cozy-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Sincronizar agora
        </button>

        <label className="flex items-center gap-2 text-xs text-cozy-muted">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => onAutoSyncChange(e.target.checked)}
            disabled={!connected}
            className="h-3.5 w-3.5 accent-cozy-accent"
          />
          Sincronizar automaticamente a cada edição
        </label>

        <span className="ml-auto flex items-center gap-1.5 text-xs">
          {status === 'error' && (
            <span className="flex items-center gap-1 text-red-500">
              <XCircle size={13} /> Falhou
            </span>
          )}
          {status === 'success' && (
            <span className="flex items-center gap-1 text-cozy-sage">
              <CheckCircle2 size={13} /> Sincronizado {lastSyncedAt ? `às ${lastSyncedAt}` : ''}
            </span>
          )}
        </span>
      </div>

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {errorMessage || 'Não deu pra sincronizar. Confira o Client ID, o link da planilha e se ela está compartilhada com edição pra sua conta Google.'}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowHelp((v) => !v)}
        className="mt-3 text-xs font-medium text-cozy-accent underline decoration-dotted underline-offset-2"
      >
        {showHelp ? 'Esconder' : 'Como configurar isso (passo a passo)'}
      </button>

      {showHelp && (
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-cozy-muted">
          <li>
            Crie uma planilha nova no Google Sheets, dê um nome e compartilhe com o e-mail de quem você quer que
            acompanhe (permissão de leitura já basta pra quem só vai olhar).
          </li>
          <li>Copie o link da planilha e cole no campo "Link ou ID da planilha" acima.</li>
          <li>
            Crie um Client ID OAuth gratuito no{' '}
            <span className="font-medium">Google Cloud Console</span> (uma vez só): ative a "Google Sheets API",
            crie uma credencial do tipo "OAuth client ID" → "Web application", e em "Authorized JavaScript origins"
            adicione o endereço deste site.
          </li>
          <li>Cole o Client ID gerado no campo acima e clique em "Conectar com Google".</li>
          <li>Clique em "Sincronizar agora" (ou ligue o automático) — pronto, a planilha atualiza.</li>
        </ol>
      )}
    </div>
  )
}
