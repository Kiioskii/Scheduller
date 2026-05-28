import { Button } from '@/components/ui/button';
import { useHealth } from '../hooks/use-health';

export function HealthStatus() {
  const { data, isLoading, isError, refetch, isFetching } = useHealth();

  return (
    <section className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Status API</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          Odśwież
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Ładowanie…</p>}
      {isError && (
        <p className="text-destructive">Backend niedostępny. Uruchom API lub Docker Compose.</p>
      )}
      {data && (
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{data.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Redis</dt>
            <dd className="font-medium">{data.redis}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Czas</dt>
            <dd className="font-medium">{new Date(data.timestamp).toLocaleString('pl-PL')}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
