import { healthResponseSchema } from '@park/shared';
import { apiFetch } from '@/lib/http';
import { z } from 'zod';

export const healthWithRedisSchema = healthResponseSchema.extend({
  redis: z.enum(['connected', 'disconnected']),
});

export type HealthWithRedis = z.infer<typeof healthWithRedisSchema>;

export const healthKeys = {
  all: ['health'] as const,
};

export async function fetchHealth(): Promise<HealthWithRedis> {
  const res = await apiFetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  const json: unknown = await res.json();
  return healthWithRedisSchema.parse(json);
}
