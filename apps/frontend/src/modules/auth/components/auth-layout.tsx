import { Link } from 'react-router-dom';

import type { ReactNode } from 'react';

export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-lg items-center px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Scheduler
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
