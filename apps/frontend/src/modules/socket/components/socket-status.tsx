import { Button } from '@/components/ui/button';
import { useSocket } from '../hooks/use-socket';

export function SocketStatus() {
  const { connected, lastPong, ping } = useSocket();

  return (
    <section className="rounded-lg border p-6">
      <h2 className="mb-2 text-lg font-medium">Socket.IO</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Połączenie WebSocket z backendem (real-time dla grafików).
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`inline-flex items-center gap-2 text-sm font-medium ${connected ? 'text-green-600' : 'text-muted-foreground'}`}
        >
          <span
            className={`size-2 rounded-full ${connected ? 'bg-green-600' : 'bg-muted-foreground'}`}
          />
          {connected ? 'Połączono' : 'Rozłączono'}
        </span>
        <Button type="button" variant="secondary" onClick={ping} disabled={!connected}>
          Wyślij ping
        </Button>
        {lastPong && (
          <span className="text-sm text-muted-foreground">
            Ostatni pong: {new Date(lastPong).toLocaleString('pl-PL')}
          </span>
        )}
      </div>
    </section>
  );
}
