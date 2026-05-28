import { Controller, Get } from '@nestjs/common';
import { healthResponseSchema } from '@park/shared';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(private readonly redis: RedisService) {}

  @Get('health')
  async health() {
    const redisOk = await this.redis.ping();

    const payload = healthResponseSchema.parse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });

    return {
      ...payload,
      redis: redisOk ? 'connected' : 'disconnected',
    };
  }
}
