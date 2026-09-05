import Icon from '@/components/Icon';

export const route = { path: '/principles', layout: 'public', access: 'public' };
export const nav = { icon: 'BookOpen', label: 'Principles', section: 'Explore', profiles: null, order: 30 };

const principles = [
  ['Facts before narratives', 'Separate direct evidence, reported claims, local information and inference.'],
  ['Power must be measured', 'Look at representation, money, organisation, skills, information and institutional access—not slogans.'],
  ['Rights need proof', 'Keep the documents, records and evidence that make rights enforceable.'],
  ['Prepare civilians, not conflict', 'Transport, communication, legal support, medical access and evacuation matter more than bravado.'],
  ['Build alliances', 'A resilient community is connected to other communities, civil society, journalists, lawyers, academics and institutions.'],
  ['Turn incidents into learning', 'Every crisis should produce a stronger process, better records and better preparedness.'],
];

export default function Principles() {
  return <div className="py-8 sm:py-10"><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operating principles</div><h1 className="mt-2 font-heading text-5xl leading-none sm:text-6xl">Awareness without capability is fragile.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">The goal is not to make a community louder. It is to make it more informed, organised, connected, documented and resilient.</p></div><div className="grid gap-3">{principles.map(([title,text], i) => <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-primary">{i+1}</div><div><div className="font-semibold">{title}</div><div className="mt-1 text-sm leading-6 text-muted-foreground">{text}</div></div></div>)}</div></div>
    <section className="mt-12 border-t border-border pt-10"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-border bg-card p-6"><Icon name="Brain" size={22} className="text-primary" /><div className="mt-4 font-heading text-2xl">Think clearly</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask what changed the system, what evidence exists, and what remains unknown.</p></div><div className="rounded-3xl border border-border bg-card p-6"><Icon name="Landmark" size={22} className="text-primary" /><div className="mt-4 font-heading text-2xl">Build leverage</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Legal capacity, professional networks, media reach and economic independence compound over time.</p></div><div className="rounded-3xl border border-border bg-card p-6"><Icon name="HeartHandshake" size={22} className="text-primary" /><div className="mt-4 font-heading text-2xl">Protect dignity</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Firmly defend rights without making civilians the instruments of escalation.</p></div></div></section>
  </div>;
}
