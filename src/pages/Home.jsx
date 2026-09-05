import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

export const route = { path: '/', layout: 'public', access: 'public' };

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-lg sm:h-32 sm:w-32">
            <ApperIcon name="Compass" size={44} strokeWidth={1.8} />
          </div>

          <h1 className="mt-10 font-heading text-6xl font-semibold leading-none tracking-tight sm:text-7xl md:text-8xl">C3H</h1>

          <p className="mt-7 font-heading text-2xl leading-tight text-muted-foreground sm:text-3xl">
            Let’s be free, open and powerful.
          </p>

          <p className="mx-auto mt-12 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            A space for questions, preparedness, participation and collective capability.
          </p>

          <Link
            to="/questions"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-background px-7 py-4 text-base font-semibold shadow-xs transition hover:bg-muted hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          >
            Explore C3H
            <ApperIcon name="ArrowRight" size={19} />
          </Link>
        </div>
      </section>
    </div>
  );
}
