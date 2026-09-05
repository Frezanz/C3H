import ApperIcon from '@/components/ApperIcon';

export const route = { path: '/preparedness', layout: 'public', access: 'public' };
export const nav = { icon: 'ShieldCheck', label: 'Preparedness', section: 'Explore', profiles: null, order: 20 };

const playbook = [
  ['1 hour', 'Warning & contact', ['Verify the threat before amplifying it.', 'Contact police/administration using the pre-verified numbers.', 'Check on children, elderly residents and anyone needing medical help.']],
  ['6 hours', 'Protect & move', ['Keep civilians together where practical.', 'Use pre-identified transport and safe routes if movement is needed.', 'Preserve evidence without escalating confrontation.']],
  ['24 hours', 'Stabilise', ['Document injuries, damage and threats with original files.', 'Ensure food, water, medicine and communications for vulnerable households.', 'Escalate credible failures to higher authorities or legal organisations.']],
  ['7 days', 'Recover & build', ['Review what failed: transport, communication, documentation or institutional access.', 'Create a permanent contact network and evidence archive.', 'Convert lessons into drills, records and stronger institutional relationships.']],
];

const checks = [
  ['Emergency contacts', 'Police, district administration, hospitals, legal support'],
  ['Transport', 'Drivers, vehicles, fuel, alternate routes, accessibility'],
  ['Communications', 'Primary numbers, secondary numbers, offline contact tree'],
  ['Records', 'Identity, property, school and other critical documents'],
  ['Vulnerable residents', 'Children, elderly, injured and people with mobility needs'],
  ['Evidence', 'Original media, dates, locations, witnesses, secure backups'],
];

export default function Preparedness() {
  return <div className="py-8 sm:py-10"><div className="max-w-4xl"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Civilian preparedness</div><h1 className="mt-2 font-heading text-5xl leading-none sm:text-6xl">Prepare for the gaps between law and reality.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Preparedness is about protecting civilians, preserving evidence, maintaining communication, and reaching institutions quickly. It is not about building confrontation.</p></div>
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{playbook.map(([time,title,items]) => <section key={time} className="rounded-3xl border border-border bg-card p-6 shadow-xs"><div className="text-xs font-bold uppercase tracking-[0.15em] text-accent">{time}</div><h2 className="mt-2 font-heading text-2xl">{title}</h2><div className="mt-5 space-y-3">{items.map(item => <div key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><ApperIcon name="Check" size={16} className="mt-1 shrink-0 text-success" />{item}</div>)}</div></section>)}</div>
    <section className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name="ClipboardCheck" size={19} /></div><div><h2 className="font-heading text-3xl">Settlement readiness checklist</h2><p className="text-sm text-muted-foreground">What should exist before an emergency.</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{checks.map(([title,text]) => <div key={title} className="rounded-2xl border border-border bg-background p-4"><div className="font-semibold">{title}</div><div className="mt-1 text-sm text-muted-foreground">{text}</div></div>)}</div></section>
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl bg-primary p-7 text-primary-foreground shadow-md"><div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">Core principle</div><div className="mt-3 font-heading text-4xl leading-tight">Document. Coordinate. Protect. Escalate lawfully.</div></div><div className="rounded-3xl border border-border bg-card p-7"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Target</div><div className="mt-3 font-heading text-3xl">A community that is difficult to isolate.</div><p className="mt-3 text-sm leading-6 text-muted-foreground">Better communication, evidence, transport, professional capacity and institutional access reduce vulnerability.</p></div></div>
  </div>;
}
