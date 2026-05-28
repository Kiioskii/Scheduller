import { getSocketBaseUrl } from '@/lib/http';
import { io, type Socket } from 'socket.io-client';

export type PongPayload = {
  message?: string;
  timestamp?: string;
};

export function createSocket(): Socket {
  return io(getSocketBaseUrl(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export function emitPing(socket: Socket, message = 'hello from Scheduler frontend') {
  socket.emit('ping', { message });
}
