import {
  buildWorkerDraftDownloadFileName,
  isReceivedFlag,
} from './received-schedules.mapper';

describe('received-schedules.mapper', () => {
  describe('buildWorkerDraftDownloadFileName', () => {
    it('builds download name from worker name and period', () => {
      expect(
        buildWorkerDraftDownloadFileName('Maciej', 'Kijowski', 2026, 6, 'PODKŁAD.xlsx'),
      ).toBe('Maciej Kijowski podklad 6/2026.xlsx');
    });

    it('preserves .xls extension', () => {
      expect(buildWorkerDraftDownloadFileName('Anna', 'Nowak', 2026, 1, 'old.xls')).toBe(
        'Anna Nowak podklad 1/2026.xls',
      );
    });
  });

  describe('isReceivedFlag', () => {
    it('accepts boolean and numeric flags', () => {
      expect(isReceivedFlag(true)).toBe(true);
      expect(isReceivedFlag(1)).toBe(true);
      expect(isReceivedFlag(false)).toBe(false);
    });
  });
});
