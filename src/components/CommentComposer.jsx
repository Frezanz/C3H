import { useState } from 'react';
import ApperIcon from '@/components/ApperIcon';

export default function CommentComposer({ onPublicSubmit, onPrivateSubmit, disabled = false }) {
  const [mode, setMode] = useState('public');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const submit = async () => {
    const text = body.trim();
    if (!text || disabled || sending) return;
    setSending(true);
    setStatus('');
    try {
      const result = mode === 'public'
        ? await onPublicSubmit(text)
        : await onPrivateSubmit(text);
      if (result?.success) {
        setBody('');
        setStatus(mode === 'public' ? 'Comment posted.' : 'Private response sent to the creator.');
      } else if (result?.error) {
        setStatus(result.error);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
        <button type="button" onClick={() => { setMode('public'); setStatus(''); }} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === 'public' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
          <ApperIcon name="MessageCircle" size={14} /> Public comment
        </button>
        <button type="button" onClick={() => { setMode('private'); setStatus(''); }} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === 'private' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
          <ApperIcon name="Mail" size={14} /> Private response
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={mode === 'private' ? 4 : 3} maxLength={mode === 'private' ? 5000 : 2000} onKeyDown={(event) => { if (mode === 'public' && event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder={mode === 'public' ? 'Add your perspective…' : 'Write a private response to the creator…'} className="min-w-0 flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        <button type="button" disabled={!body.trim() || disabled || sending} onClick={submit} className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {sending ? 'Sending…' : mode === 'public' ? 'Post' : 'Send'}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">{mode === 'public' ? 'Visible to people viewing this discussion.' : 'Only the creator receives this response. Their email stays private.'}</p>
        {status && <span className="text-right text-xs font-medium text-primary">{status}</span>}
      </div>
    </div>
  );
}
