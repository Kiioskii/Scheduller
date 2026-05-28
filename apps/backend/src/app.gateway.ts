import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { z } from 'zod';

const pingSchema = z.object({
  message: z.string().optional(),
});

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class AppGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown) {
    const parsed = pingSchema.safeParse(data);
    const message = parsed.success ? parsed.data.message : undefined;

    return {
      event: 'pong',
      data: {
        message: message ?? 'pong',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
