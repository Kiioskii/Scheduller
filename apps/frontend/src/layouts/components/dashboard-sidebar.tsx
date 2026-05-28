import { CalendarDays, Home, LogOut, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth/hooks/use-auth';

const navItems = [
  { to: '/dashboard', label: 'Przegląd', icon: Home, end: true },
  { to: '/dashboard/schedules', label: 'Grafiki', icon: CalendarDays, end: false },
  { to: '/dashboard/settings', label: 'Ustawienia', icon: Settings, end: false },
];

export function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-5 py-5">
        <p className="text-lg font-semibold tracking-tight">Scheduler</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Wyloguj się
        </Button>
      </div>
    </aside>
  );
}
