import { CalendarDays, LayoutGrid, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const features = [
  {
    icon: CalendarDays,
    title: 'Grafiki w jednym miejscu',
    description: 'Planuj zmiany, urlopy i dyżury bez rozproszenia w arkuszach.',
  },
  {
    icon: Users,
    title: 'Zespół pod kontrolą',
    description: 'Przypisuj role i widoczność grafików dla całej organizacji.',
  },
  {
    icon: Zap,
    title: 'Real-time',
    description: 'Zmiany synchronizują się na żywo dzięki Socket.IO i Redis.',
  },
  {
    icon: LayoutGrid,
    title: 'Przejrzysty panel',
    description: 'Dashboard ze statusem API, połączeniem i tabelą wydarzeń.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-semibold tracking-tight">Scheduler</span>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Zaloguj się</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Załóż konto</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Planowanie grafików
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Twórz grafiki pracy szybciej i bez chaosu w Excelu
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Scheduler łączy prosty interfejs z backendem NestJS, Supabase i aktualizacjami na
            żywo — wszystko w jednej aplikacji.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Rozpocznij za darmo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/signin">Mam już konto</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h2 className="mb-2 font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Scheduler — monorepo NestJS + React
      </footer>
    </div>
  );
}
