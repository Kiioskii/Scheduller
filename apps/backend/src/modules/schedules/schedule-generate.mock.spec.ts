import { buildMockGenerateScheduleResult, isScheduleGenerateMockEnabled, shouldUseMockWorkerDrafts } from './schedule-generate.mock';
import { ConfigService } from '@nestjs/config';

describe('schedule-generate.mock', () => {
  it('detects mock env flag', () => {
    expect(isScheduleGenerateMockEnabled('true')).toBe(true);
    expect(isScheduleGenerateMockEnabled('1')).toBe(true);
    expect(isScheduleGenerateMockEnabled('yes')).toBe(true);
    expect(isScheduleGenerateMockEnabled('false')).toBe(false);
    expect(isScheduleGenerateMockEnabled(undefined)).toBe(false);
  });

  it('builds valid mock generate result with preview workers', () => {
    const result = buildMockGenerateScheduleResult(2026, 6);

    expect(result.status).toBe('accepted');
    expect(result.preview.year).toBe(2026);
    expect(result.preview.month).toBe(6);
    expect(result.preview.daysInMonth).toBe(30);
    expect(result.preview.workers).toHaveLength(3);
    expect(result.preview.workers[0].rows[0][1].start.text).toBe('8,00');
    expect(result.preview.workers[1].rows[0][9].start.fill).toBe('yellow');
    expect(result.preview.workers[1].rows[0][9].end.fill).toBe('purple');
  });

  it('shouldUseMockWorkerDrafts reads env flags', () => {
    const config = {
      get: (key: string) =>
        key === 'SCHEDULE_MOCK_WORKER_DRAFTS' ? 'true' : undefined,
    } as ConfigService;

    expect(shouldUseMockWorkerDrafts(config)).toBe(true);
  });
});
