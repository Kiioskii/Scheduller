import { HealthStatus } from '@/modules/health';
import { ScheduleTable } from '@/modules/schedule';
import { SocketStatus } from '@/modules/socket';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">Aplikacja do tworzenia grafików</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <HealthStatus />
        <SocketStatus />
        <ScheduleTable />
      </main>
    </div>
  );
}

export default App;
