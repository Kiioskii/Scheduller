import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket, emitPing, type PongPayload } from '../api/socket.client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    const instance = createSocket();

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.on('pong', (data: PongPayload) => {
      setLastPong(data.timestamp ?? new Date().toISOString());
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, []);

  const ping = () => {
    if (socket) emitPing(socket);
  };

  return { connected, lastPong, ping };
}
