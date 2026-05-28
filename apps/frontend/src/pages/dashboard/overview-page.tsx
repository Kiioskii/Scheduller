import { HealthStatus } from '@/modules/health';
import { ScheduleTable } from '@/modules/schedule';
import { SocketStatus } from '@/modules/socket';

export function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-muted/20 p-6">
        <h2 className="text-lg font-medium">Witaj w Scheduler</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ten panel zbiera status backendu, połączenie WebSocket oraz przykładowy grafik. Po
          podłączeniu Supabase i API dane będą pochodzić z Twojej bazy i serwera.
        </p>
      </section>

      <HealthStatus />
      <SocketStatus />
      <ScheduleTable />
    </div>
  );
}
