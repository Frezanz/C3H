import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

export const route = { path: '/', layout: 'public', access: 'public' };

const focus = [
  { icon: 'Shield', title: 'Be harder to ignore', text: 'Build documentation, representation, legal capacity, and institutional relationships before a crisis.' },
  { icon: 'Map', title: 'Know your weak points', text: 'Remote settlements, transport, communications, records, and emergency access should be mapped in advance.' },
  { icon: 'Users', title: 'Turn people into capability', text: 'A strong community is not just a population. It is organised knowledge, skills, networks, and trust.' },
];

export default function Home() {
  return (
    <div>
      <section className="grid min-h-[72vh] items-end gap-10 py-14 lg:grid-cols-[1.25fr_.75fr] lg:py-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-xs"><span className="h-2 w-2 rounded-full bg-accent" /> Community awareness platform</div>
          <h1 className="max-w-4xl font-heading text-5xl leading-[.95] tracking-tight sm:text-6xl lg:text-8xl">Let's be <span className="text-primary">free, open</span> and powerful.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">A place to ask uncomfortable questions, understand power, prepare for real problems, and turn awareness into practical community capability.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/questions" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-md transition hover:translate-y-[-1px] hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Explore the questions <ApperIcon name="ArrowUpRight" size={17} /></Link>
            <Link to="/preparedness" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Build preparedness</Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-lg sm:p-8">
          <div className="absolute right-[-32px] top-[-32px] h-40 w-40 rounded-full border-[18px] border-accent/20" />
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">The question behind the question</div>
          <div className="mt-4 font-heading text-4xl leading-tight">What can we actually do if power is used against us?</div>
          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3"><ApperIcon name="FileText" size={17} /> Can we prove our rights?</div>
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3"><ApperIcon name="Phone" size={17} /> Can remote settlements call for help?</div>
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3"><ApperIcon name="Truck" size={17} /> Can vulnerable families move safely?</div>
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3"><ApperIcon name="Scale" size={17} /> Can we reach institutions beyond the local level?</div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-14 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Three directions</div><h2 className="mt-2 font-heading text-4xl sm:text-5xl">Awareness should become capability.</h2></div></div>
        <div className="grid gap-4 md:grid-cols-3">{focus.map((item, i) => <div key={item.title} className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition hover:-translate-y-1 hover:shadow-md">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary"><ApperIcon name={item.icon} size={22} /></div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">0{i+1}</div>
          <h3 className="mt-2 font-heading text-2xl">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </div>)}</div>
      </section>

      <section className="rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lg sm:p-10 lg:p-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">Start with one question</div><div className="mt-3 max-w-4xl font-heading text-4xl leading-tight sm:text-5xl">If something goes wrong tomorrow, what would your community wish it had prepared today?</div></div><Link to="/questions" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">See the question set <ApperIcon name="ArrowRight" size={17} /></Link></div>
      </section>
    </div>
  );
}
