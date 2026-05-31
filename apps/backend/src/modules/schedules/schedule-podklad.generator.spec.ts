import { buildPodkladContentDisposition } from './schedule-podklad.content-disposition';

describe('schedule-podklad.content-disposition', () => {
  it('builds ASCII-safe Content-Disposition with UTF-8 filename*', () => {
    const header = buildPodkladContentDisposition('PODKŁAD 01.06-30.06 R.xlsx');
    expect(header).toContain('filename="PODKLAD 01.06-30.06 R.xlsx"');
    expect(header).toContain("filename*=UTF-8''");
    expect(header).not.toMatch(/filename="[^"]*Ł/);
  });
});
