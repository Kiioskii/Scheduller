import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { healthResponseSchema } from '@scheduler/shared';
import { RedisService } from './redis/redis.service';
import { HealthResponseDto } from './swagger/dto/health.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly redis: RedisService) {}

  @Get('health')
  @ApiOperation({ summary: 'Sprawdzenie stanu API i połączenia z Redis' })
  @ApiOkResponse({ type: HealthResponseDto })
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
