import { ScheduleTable } from '@/modules/schedule';

export function DashboardSchedulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Grafiki</h2>
        <p className="text-sm text-muted-foreground">
          Lista zaplanowanych wpisów — docelowo z API lub Supabase.
        </p>
      </div>
      <ScheduleTable />
    </div>
  );
}
