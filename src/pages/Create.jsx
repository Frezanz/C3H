import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

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
  post: { title: 'Create a post', prompt: 'What do you want to share?' },
  announcement: { title: 'Create an announcement', prompt: 'Write the announcement' },
  group: { title: 'Create a group', prompt: 'Describe what this group exists to do' },
  project: { title: 'Create a project', prompt: 'Describe what this project aims to achieve' },
  research: { title: 'Create research', prompt: 'Describe the research, study or finding' },
  report: { title: 'Create a report', prompt: 'Describe the issue, observation or evidence' },
};

export default function Create() {
  const location = useLocation();
  const initialType = useMemo(() => {
    const type = new URLSearchParams(location.search).get('type');
    return OPTIONS.some((option) => option.key === type) ? type : 'post';
  }, [location.search]);
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const active = FIELD_COPY[type];

  const selectType = (nextType) => {
    setType(nextType);
    setTitle('');
    setBody('');
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl px-0 py-6 sm:py-10">
      <div className="mb-5 flex items-center gap-3 px-1">
        <Link to="/" aria-label="Back to home" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]">
          <ApperIcon name="ArrowLeft" size={18} />
        </Link>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Create</div>
          <h1 className="mt-1 text-2xl font-heading font-semibold tracking-tight">Add something to C3H</h1>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose type</div>
          <div className="grid gap-1">
            {OPTIONS.map((option) => {
              const selected = type === option.key;
              return (
                <button
                  type="button"
                  key={option.key}
                  onClick={() => selectType(option.key)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] ${selected ? 'bg-muted text-foreground shadow-xs' : 'text-foreground'}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary group-hover:bg-background">
                    <ApperIcon name={option.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{active.label}</div>
            <h2 className="mt-2 text-2xl font-heading font-semibold tracking-tight">{active.title}</h2>
          </div>

          <div className="mt-6 space-y-5">
            {type !== 'post' && (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={`Give your ${active.label.toLowerCase()} a clear title`}
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium">{active.prompt}</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={type === 'post' ? 10 : 12}
                placeholder={type === 'post' ? 'Write freely. You can refine the structure later.' : 'Add the details people need to understand it.'}
                className="min-h-48 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><ApperIcon name="Paperclip" size={15} /> Add attachment</button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><ApperIcon name="Tag" size={15} /> Add tags</button>
            </div>

            <div className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              This creates the right starting surface for <span className="font-medium text-foreground">{active.label.toLowerCase()}</span>. Saving to the database, files, review and publishing rules will be wired into the live content model next.
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <button type="button" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Save draft</button>
              <button type="button" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Continue</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
