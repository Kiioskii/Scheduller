import * as XLSX from 'xlsx';

export const SAMPLE_PODKLAD_FILE_NAME = 'PODKŁAD 01.06-30.06 R (2).xlsx';

export function createSamplePodkladFixture(): { buffer: Buffer; originalname: string } {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['CZERWIEC 2026'],
    [],
    ['nazwisko', 'imię'],
    ['Kijowski', 'Maciej'],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  return {
    buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer,
    originalname: SAMPLE_PODKLAD_FILE_NAME,
  };
}
