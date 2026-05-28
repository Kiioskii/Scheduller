import { Outlet } from 'react-router-dom';

import { DashboardSidebar } from './components/dashboard-sidebar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b px-8 py-5">
          <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzaj grafikami i monitoruj stan aplikacji
          </p>
        </header>
        <main className="flex-1 overflow-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
