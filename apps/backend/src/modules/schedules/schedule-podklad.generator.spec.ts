import * as XLSX from 'xlsx';

import {
  buildPodkladContentDisposition,
  formatPodkladFileName,
  generateSchedulePodkladBuffer,
  getDaysInMonth,
} from './schedule-podklad.generator';

describe('schedule-podklad.generator', () => {
  it('builds June 2026 layout matching template structure', () => {
    const buffer = generateSchedulePodkladBuffer(2026, 6);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets.Arkusz1;
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

    expect(sheet['!merges']?.length).toBeGreaterThan(30);
    expect(rows[0]?.[0]).toBe('CZERWIEC 2026');
    expect(rows[0]?.[2]).toBe('Pon.');
    expect(rows[1]?.[2]).toBe('1');
    expect(rows[1]?.[60]).toBe('30');
    expect(rows[3]?.[0]).toBe('nazwisko');
    expect(rows[3]?.[1]).toBe('imię');
    expect(rows[9]?.[1]).toBe('RANO');
    expect(rows[11]?.[1]).toBe('POPOŁUDNIE');
    expect(rows[15]?.[1]).toBe('PRZEDZIAŁ');
    expect(rows[16]?.[3]).toBe('13');
    expect(rows[16]?.[4]).toBe('22');
    expect(rows[17]?.[3]).toBe('9');
  });

  it('formats download file name', () => {
    expect(formatPodkladFileName(2026, 6)).toBe('PODKŁAD 01.06-30.06 R.xlsx');
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(formatPodkladFileName(2026, 2)).toBe('PODKŁAD 01.02-28.02 R.xlsx');
  });

  it('builds ASCII-safe Content-Disposition with UTF-8 filename*', () => {
    const header = buildPodkladContentDisposition('PODKŁAD 01.06-30.06 R.xlsx');
    expect(header).toContain('filename="PODKLAD 01.06-30.06 R.xlsx"');
    expect(header).toContain("filename*=UTF-8''");
    expect(header).not.toMatch(/filename="[^"]*Ł/);
  });
});
