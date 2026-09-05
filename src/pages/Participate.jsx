import { useState } from 'react';
import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { Badge } from '@/components/ui/badge';

export const route = { path: '/participate', layout: 'public', access: 'public' };
export const nav = { icon: 'Network', label: 'Participate', section: 'Community', profiles: null, order: 2 };

const AREAS = [
  { icon: 'FlaskConical', name: 'Science', text: 'Research questions, evidence, experiments and technical work.' },
  { icon: 'Landmark', name: 'Civic & political', text: 'Policy, representation, governance and institutional understanding.' },
  { icon: 'Construction', name: 'Development', text: 'Technology, infrastructure, local capability and practical projects.' },
  { icon: 'GraduationCap', name: 'Education', text: 'Learning resources, teaching, mentoring and knowledge sharing.' },
  { icon: 'Megaphone', name: 'Awareness', text: 'Public information, documentation, communication and outreach.' },
  { icon: 'Search', name: 'Research', text: 'Language, culture, history, society, data and community studies.' },
];

const ROLES = ['Member', 'Contributor', 'Researcher', 'Volunteer', 'Coordinator', 'Organizer'];

export default function Participate() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-8 py-10">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Participation</div>
        <h1 className="mt-2 text-3xl font-heading font-semibold tracking-tight sm:text-4xl">Find something worth contributing to.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">C3H treats participation as a relationship between a person, a group and a role. One person can have different roles in different projects.</p>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-base font-heading font-semibold">Areas of participation</h2><p className="mt-1 text-sm text-muted-foreground">Choose what kind of work interests you.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area) => {
            const active = selected === area.name;
            return (
              <button type="button" key={area.name} onClick={() => setSelected(active ? null : area.name)} className={`rounded-2xl border p-5 text-left shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${active ? 'border-primary bg-muted' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name={area.icon} size={19} /></div>{active && <Badge>Selected</Badge>}</div>
                <div className="mt-4 text-sm font-medium">{area.name}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{area.text}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-start gap-3"><ApperIcon name="UsersRound" size={20} /><div><h2 className="text-base font-heading font-semibold">Your role can change by group.</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">For example, you could be a Researcher in one project and a Contributor or Coordinator in another.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{ROLES.map((role) => <Badge key={role} variant="outline">{role}</Badge>)}</div>
      </section>

      <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="max-w-2xl"><div className="text-xs font-medium uppercase tracking-wide opacity-75">Next step</div><h2 className="mt-2 text-2xl font-heading font-semibold">Ready to participate?</h2><p className="mt-2 text-sm leading-relaxed opacity-85">Sign in to keep your identity and future group roles attached to one account.</p><Link to="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><ApperIcon name="LogIn" size={16} /> Sign in</Link></div>
      </div>
    </div>
  );
}
