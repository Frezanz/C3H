import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

export const route = { path: '/questions', layout: 'public', access: 'public' };
export const nav = { icon: 'CircleHelp', label: 'Questions', section: 'Explore', profiles: null, order: 10 };

const groups = [
  { label: 'Safety & immediate threat', icon: 'Siren', items: [
    'If violence reaches a remote settlement, who protects ordinary civilians who are not involved?',
    'How quickly can police or security forces reach isolated Chakma/Hajong settlements?',
    'If residents must leave urgently, who provides transportation for children, elderly people and injured persons?',
    'What happens if the only road connecting a remote settlement becomes blocked or unsafe?',
    'If mobile networks or electricity fail, how will isolated settlements communicate with authorities?'
  ]},
  { label: 'Legal & institutional power', icon: 'Scale', items: [
    'Who is legally responsible for protecting civilians during a serious local threat?',
    'What is the next authority if residents believe the local response is failing?',
    'What evidence is needed to report intimidation, unlawful exclusion or violence?',
    'Which independent institutions can be approached when local power is politically complicated?',
    'Is legal protection meaningful if vulnerable civilians cannot reach the institutions enforcing it?'
  ]},
  { label: 'Community capability', icon: 'Network', items: [
    'Does every major settlement have emergency contacts and a verified communication chain?',
    'Which settlements have sparse housing, poor transport, weak connectivity or limited police access?',
    'How many vehicles could realistically move vulnerable residents during an emergency?',
    'Where could displaced families temporarily stay if returning home became unsafe?',
    'Can separate community organisations coordinate within hours instead of days?'
  ]},
  { label: 'Long-term power', icon: 'TrendingUp', items: [
    'How much political representation does the community actually have?',
    'How strong is the community’s legal, media, economic and professional capacity?',
    'Who are reliable allies in civil society, academia, journalism, law and government?',
    'Can the community present evidence nationally instead of depending only on local narratives?',
    'What capabilities would make confrontation less effective against civilians in the first place?'
  ]},
];

export default function Questions() {
  return <div className="py-8 sm:py-10">
    <div className="max-w-4xl"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Question bank</div><h1 className="mt-2 font-heading text-5xl leading-none sm:text-6xl">Questions worth answering before the crisis.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Context-rich questions for awareness, preparedness, institutional access, and community power. They are meant to expose blind spots, not prescribe violence.</p></div>
    <div className="mt-10 grid gap-5 lg:grid-cols-2">{groups.map(group => <section key={group.label} className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name={group.icon} size={19} /></div><h2 className="font-heading text-2xl">{group.label}</h2></div><div className="mt-5 space-y-3">{group.items.map((q, i) => <div key={`${group.label}-${i}`} className="rounded-2xl bg-muted/80 p-4 text-sm leading-6 text-foreground"><span className="mr-2 font-semibold text-primary">{i+1}.</span>{q}</div>)}</div></section>)}</div>
    <div className="mt-8 rounded-3xl border border-border bg-background p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-heading text-2xl">The hardest question</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">If violence begins tonight in a remote settlement, what can civilians realistically do in the first 1 hour, 6 hours, 24 hours and 7 days?</p></div><Link to="/preparedness" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Turn questions into preparedness <ApperIcon name="ArrowRight" size={16} /></Link></div></div>
  </div>;
}
