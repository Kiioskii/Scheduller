import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { RedisService } from './redis/redis.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: RedisService,
          useValue: { ping: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('returns health payload', async () => {
    const result = await controller.health();
    expect(result.status).toBe('ok');
    expect(result.redis).toBe('connected');
  });
});
