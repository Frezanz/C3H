import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ApperIcon from '@/components/ApperIcon';
import PeoplePicker from '@/components/PeoplePicker';
import { useFunction } from '@/hooks/useFunction';

export const route = { path: '/create', layout: 'public', access: 'public' };

const OPTIONS = [
  { key: 'post', label: 'Post', description: 'Share plain text, ideas, questions or updates.', icon: 'PenLine' },
  { key: 'announcement', label: 'Announcement', description: 'Publish an important community update.', icon: 'Megaphone' },
  { key: 'group', label: 'Group', description: 'Start a community around a shared purpose.', icon: 'Users' },
  { key: 'project', label: 'Project', description: 'Create something people can work on together.', icon: 'FolderKanban' },
  { key: 'research', label: 'Research', description: 'Create a paper, study, dataset or finding.', icon: 'BookOpen' },
  { key: 'report', label: 'Report', description: 'Document an issue, observation or evidence.', icon: 'FileBarChart' },
];

const FIELD_COPY = {
  post: { label: 'Post', title: 'Create a post', prompt: 'What do you want to share?' },
  announcement: { label: 'Announcement', title: 'Create an announcement', prompt: 'Write the announcement' },
  group: { label: 'Group', title: 'Create a group', prompt: 'Describe what this group exists to do' },
  project: { label: 'Project', title: 'Create a project', prompt: 'Describe what this project aims to achieve' },
  research: { label: 'Research', title: 'Create research', prompt: 'Describe the research, study or finding' },
  report: { label: 'Report', title: 'Create a report', prompt: 'Describe the issue, observation or evidence' },
};

const VISIBILITY_OPTIONS = [
  { key: 'public', label: 'Public', description: 'Anyone can view this content.', icon: 'Globe2' },
  { key: 'community', label: 'C3H members', description: 'Only signed-in C3H members can view it.', icon: 'Users' },
  { key: 'selected', label: 'Selected people', description: 'Only people you choose can view it.', icon: 'UserRoundCheck' },
  { key: 'group', label: 'Group members', description: 'Only members of a selected group can view it.', icon: 'UsersRound' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DRAFT_KEY = 'c3h:create-draft';

export default function Create() {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { invoke: createContent, loading: creating } = useFunction(import.meta.env.VITE_CONTENT_API, { showError: false });
  const { invoke: listGroups } = useFunction(import.meta.env.VITE_CONTENT_API, { showError: false });
  const [groups, setGroups] = useState([]);
  const initialType = useMemo(() => {
    const requestedType = new URLSearchParams(location.search || '').get('type');
    return OPTIONS.some((option) => option.key === requestedType) ? requestedType : 'post';
  }, [location.search]);
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('edit');
  const [status, setStatus] = useState('');
  const [draftAvailable, setDraftAvailable] = useState(false);
  const active = FIELD_COPY[type] ?? FIELD_COPY.post;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      setDraftAvailable(Boolean(saved && (saved.title || saved.body || saved.tags?.length)));
    } catch (_) {
      setDraftAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (type !== initialType) setType(initialType);
  }, [initialType]);

  const selectType = (nextType) => {
    if (!FIELD_COPY[nextType]) return;
    setType(nextType); setTitle(''); setBody(''); setAttachments([]); setTags([]); setTagInput(''); setShowTagInput(false); setStep('edit'); setStatus('');
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const valid = selected.filter((file) => file.size <= MAX_FILE_SIZE);
    setAttachments((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const next = valid.filter((file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`));
      return [...current, ...next];
    });
    event.target.value = '';
  };
  const removeAttachment = (index) => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const addTag = () => {
    const normalized = tagInput.trim().replace(/^#/, '').replace(/\s+/g, '-');
    if (!normalized) return;
    if (!tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) setTags((current) => [...current, normalized]);
    setTagInput('');
  };
  const handleTagKeyDown = (event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTag(); } if (event.key === 'Escape') { setTagInput(''); setShowTagInput(false); } };
  const removeTag = (tagToRemove) => setTags((current) => current.filter((tag) => tag !== tagToRemove));
  const formatFileSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const saveDraft = () => {
    const draft = { type, title, body, tags, visibility, selectedGroup, passwordEnabled, selectedPeople: selectedPeople.map((person) => person?.User?.Id ?? person?.Id).filter(Boolean), savedAt: new Date().toISOString() };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (_) {}
    setDraftAvailable(true);
    setStatus('Draft saved on this device.');
  };

  const restoreDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft) return;
      if (FIELD_COPY[draft.type]) setType(draft.type);
      setTitle(draft.title || ''); setBody(draft.body || ''); setTags(Array.isArray(draft.tags) ? draft.tags : []); setVisibility(draft.visibility || 'public'); setSelectedGroup(draft.selectedGroup || ''); setPasswordEnabled(Boolean(draft.passwordEnabled));
      setSelectedPeople(Array.isArray(draft.selectedPeople) ? draft.selectedPeople.map((id) => ({ Id: id, User: { Id: id, Name: id } })) : []);
      setStep('edit'); setStatus('Draft restored. Passwords are never restored from a draft.');
    } catch (_) {
      setStatus('The saved draft could not be restored.');
    }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
    setDraftAvailable(false);
    setStatus('Saved draft cleared.');
  };

  const loadGroupOptions = async () => {
    if (groups.length) return;
    const result = await listGroups({ action: 'list_groups' });
    if (result?.success) setGroups(Array.isArray(result.data) ? result.data : []);
  };

  const continueToReview = () => {
    if (!user?.Id) { navigate('/login'); return; }
    if (type !== 'post' && !title.trim()) { setStatus('Add a title before continuing.'); return; }
    if (!body.trim()) { setStatus('Add some content before continuing.'); return; }
    if (visibility === 'selected' && selectedPeople.length === 0) { setStatus('Choose at least one person for selected access.'); return; }
    if (visibility === 'group' && !selectedGroup) { setStatus('Choose a group for group-only access.'); return; }
    if (passwordEnabled && !password) { setStatus('Enter a password or turn password protection off.'); return; }
    setStatus(''); setStep('review');
  };

  const publish = async () => {
    if (!user?.Id) { navigate('/login'); return; }
    setStatus('');
    const selectedPeopleIds = selectedPeople.map((person) => person?.User?.Id ?? person?.Id).filter(Boolean);
    const created = await createContent({ action: 'create_content', type, title, body, visibility, selected_people: selectedPeopleIds, selected_group: selectedGroup, password: passwordEnabled ? password : '' });
    if (!created?.success || !created.data?.id) { setStatus(created?.error || 'Unable to create content.'); return; }
    const published = await createContent({ action: 'publish_content', content_id: created.data.id });
    if (!published?.success) { setStatus(published?.error || 'Content was created but could not be published.'); return; }
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
    setDraftAvailable(false);
    setStatus('Published successfully.');
    setTimeout(() => navigate('/'), 500);
  };

  const visibilityLabel = VISIBILITY_OPTIONS.find((option) => option.key === visibility)?.label ?? 'Public';

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl px-0 py-6 sm:py-10">
      <div className="mb-5 flex items-center gap-3 px-1"><Link to="/" aria-label="Back to home" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"><ApperIcon name="ArrowLeft" size={18} /></Link><div className="min-w-0"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Create</div><h1 className="mt-1 text-2xl font-heading font-semibold tracking-tight">Add something to C3H</h1></div></div>
      {!user?.Id ? <section className="rounded-2xl border border-border bg-card p-6 shadow-xs"><h2 className="text-xl font-heading font-semibold">Sign in to create</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Creating and publishing content is available to signed-in C3H members.</p><Link to="/login" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sign in</Link></section> : <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-card p-3 shadow-xs"><div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose type</div><div className="grid gap-1">{OPTIONS.map((option) => { const selected = type === option.key; return <button type="button" key={option.key} onClick={() => selectType(option.key)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] ${selected ? 'bg-muted text-foreground shadow-xs' : 'text-foreground'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary group-hover:bg-background"><ApperIcon name={option.icon} size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{option.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{option.description}</span></span></button>; })}</div></section>
        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">{step === 'review' ? <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review</div><h2 className="mt-2 text-2xl font-heading font-semibold tracking-tight">Ready to publish</h2><div className="mt-6 space-y-4"><div className="rounded-xl border border-border bg-muted/40 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{active.label}</div><div className="mt-2 text-lg font-semibold">{title || 'Untitled post'}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{body}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-4"><div className="text-xs text-muted-foreground">Visibility</div><div className="mt-1 font-medium">{visibilityLabel}{passwordEnabled ? ' + password' : ''}</div></div><div className="rounded-xl border border-border p-4"><div className="text-xs text-muted-foreground">Attachments</div><div className="mt-1 font-medium">{attachments.length}</div></div></div><div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setStep('edit')} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Back to edit</button><button type="button" disabled={creating} onClick={publish} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{creating ? 'Publishing…' : 'Publish'}</button></div>{status && <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary">{status}</div>}</div></div> : <div><div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{active.label}</div><h2 className="mt-2 text-2xl font-heading font-semibold tracking-tight">{active.title}</h2></div><div className="mt-6 space-y-5">{draftAvailable && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"><div className="min-w-0"><div className="text-sm font-medium">Saved draft available</div><div className="text-xs text-muted-foreground">Restore the last draft saved on this device.</div></div><div className="flex shrink-0 gap-2"><button type="button" onClick={restoreDraft} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Restore</button><button type="button" onClick={clearDraft} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear</button></div></div>}{type !== 'post' && <label className="block space-y-2"><span className="text-sm font-medium">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Give your ${active.label.toLowerCase()} a clear title`} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></label>}<label className="block space-y-2"><span className="text-sm font-medium">{active.prompt}</span><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={type === 'post' ? 10 : 12} placeholder={type === 'post' ? 'Write freely. You can refine the structure later.' : 'Add the details people need to understand it.'} className="min-h-48 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></label><input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><ApperIcon name="Paperclip" size={15} /> Add attachment</button><button type="button" onClick={() => setShowTagInput((value) => !value)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${showTagInput || tags.length ? 'border-primary/40 bg-muted' : 'border-border'}`}><ApperIcon name="Tag" size={15} /> Add tags{tags.length > 0 ? ` (${tags.length})` : ''}</button></div>{attachments.length > 0 && <div className="space-y-2"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachments</div><div className="grid gap-2">{attachments.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary"><ApperIcon name="File" size={16} /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{file.name}</div><div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div></div><button type="button" onClick={() => removeAttachment(index)} aria-label={`Remove ${file.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ApperIcon name="X" size={16} /></button></div>)}</div><p className="text-xs text-muted-foreground">Files are selected locally for now. They are not uploaded or included in publishing yet. Maximum size: 20 MB each.</p></div>}{showTagInput && <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</div><div className="mt-2 flex gap-2"><input autoFocus value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" onClick={addTag} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Add</button></div><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium ring-1 ring-border">#{tag}<button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"><ApperIcon name="X" size={12} /></button></span>)}{!tags.length && <span className="text-xs text-muted-foreground">No tags added yet.</span>}</div></div>}
          <section className="rounded-2xl border border-border bg-background p-4 sm:p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name="Shield" size={17} /></div><div className="min-w-0"><div className="text-base font-heading font-semibold">Access</div><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Choose who can open this content. Passwords are hashed before storage.</p></div></div><div className="mt-4 grid gap-2">{VISIBILITY_OPTIONS.map((option) => { const selected = visibility === option.key; return <button type="button" key={option.key} onClick={() => { setVisibility(option.key); if (option.key === 'group') loadGroupOptions(); }} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] ${selected ? 'border-primary/40 bg-muted' : 'border-border bg-card'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary"><ApperIcon name={option.icon} size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{option.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{option.description}</span></span>{selected && <ApperIcon name="Check" size={17} className="shrink-0 text-primary" />}</button>; })}</div>
            {visibility === 'selected' && <div className="mt-4 rounded-xl border border-border bg-card p-3"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">People who can view</div><div className="mt-2"><PeoplePicker value={selectedPeople} onChange={setSelectedPeople} multiple placeholder="Choose people" aria-label="Choose people who can view this content" /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Only the selected members will be granted access.</p></div>}
            {visibility === 'group' && <div className="mt-4 rounded-xl border border-border bg-card p-3"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Group that can view</div><select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Choose a group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>{!groups.length && <p className="mt-2 text-xs leading-5 text-muted-foreground">No groups are available yet. Create a group first.</p>}</div>}
            <div className="mt-4 rounded-xl border border-border bg-card p-3"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="text-sm font-medium">Add a password</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Use any characters and any length. The password itself is never stored in the browser draft.</p></div><button type="button" role="switch" aria-checked={passwordEnabled} onClick={() => setPasswordEnabled((value) => !value)} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition duration-(--transition-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${passwordEnabled ? 'border-primary bg-primary' : 'border-border bg-muted'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background transition-transform duration-(--transition-fast) ${passwordEnabled ? 'left-6' : 'left-1'}`} /></button></div>{passwordEnabled && <div className="mt-3 flex gap-2"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter a password" autoComplete="new-password" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">{showPassword ? 'Hide' : 'Show'}</button></div>}</div>
          </section><div className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground"><div className="font-medium text-foreground">Access summary</div><p className="mt-1">{visibilityLabel} can view this {active.label.toLowerCase()}{passwordEnabled ? ' with the password' : ''}. {visibility === 'selected' && selectedPeople.length ? `${selectedPeople.length} people selected.` : ''}{visibility === 'group' && selectedGroup ? ' Group access selected.' : ''}</p></div>{status && <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary">{status}</div>}<div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={saveDraft} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Save draft</button><button type="button" onClick={continueToReview} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Review & continue</button></div></div></div>}
        </section>
      </div>}
    </div>
  );
}
