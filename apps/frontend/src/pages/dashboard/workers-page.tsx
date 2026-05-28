import { WorkersTable } from '@/modules/workers';

export function DashboardWorkersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Pracownicy</h2>
        <p className="text-sm text-muted-foreground">
          Zarządzaj listą pracowników i ich priorytetem (1–10).
        </p>
      </div>
      <WorkersTable />
    </div>
  );
}
