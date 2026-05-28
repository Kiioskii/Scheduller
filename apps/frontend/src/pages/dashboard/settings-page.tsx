import { useAuth } from '@/modules/auth/hooks/use-auth';
import { ThemeSelect } from '@/modules/theme';

export function DashboardSettingsPage() {
  const { user, session } = useAuth();

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Wygląd</h2>
          <p className="text-sm text-muted-foreground">
            Wybierz jasny, ciemny motyw lub dopasuj do ustawień systemu.
          </p>
        </div>
        <ThemeSelect />
      </div>

      <div>
        <h2 className="text-lg font-medium">Ustawienia konta</h2>
        <p className="text-sm text-muted-foreground">Informacje o zalogowanej sesji Supabase.</p>
      </div>

      <dl className="divide-y rounded-lg border text-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="font-medium sm:col-span-2">{user?.email ?? '—'}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-muted-foreground">ID użytkownika</dt>
          <dd className="break-all font-mono text-xs sm:col-span-2">{user?.id ?? '—'}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-muted-foreground">Sesja wygasa</dt>
          <dd className="font-medium sm:col-span-2">
            {session?.expires_at
              ? new Date(session.expires_at * 1000).toLocaleString('pl-PL')
              : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
