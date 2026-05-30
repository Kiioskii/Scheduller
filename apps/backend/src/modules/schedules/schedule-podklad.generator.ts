import * as XLSX from 'xlsx';

const MONTH_UPPER = [
  'STYCZEŃ',
  'LUTY',
  'MARZEC',
  'KWIECIEŃ',
  'MAJ',
  'CZERWIEC',
  'LIPIEC',
  'SIERPIEŃ',
  'WRZESIEŃ',
  'PAŹDZIERNIK',
  'LISTOPAD',
  'GRUDZIEŃ',
] as const;

const WEEKDAY_LABELS = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'] as const;

const SHIFT_ROWS: Array<{ label?: string; values?: [number, number] | [number] }> = [
  { label: 'RANO', values: [0] },
  { label: 'POPOŁUDNIE', values: [0] },
  { label: 'DOWOLNIE', values: [0] },
  { label: 'PRZEDZIAŁ', values: [13, 22] },
  { values: [9] },
  { label: 'NIE MOGĘ', values: [0] },
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatPodkladFileName(year: number, month: number): string {
  const days = getDaysInMonth(year, month);
  const mm = String(month).padStart(2, '0');
  const first = `01.${mm}`;
  const last = `${String(days).padStart(2, '0')}.${mm}`;
  return `PODKŁAD ${first}-${last} R.xlsx`;
}

/** ASCII-only name for Content-Disposition `filename=` (HTTP headers allow only byte values 0–255, printable ASCII). */
export function formatPodkladFileNameAscii(year: number, month: number): string {
  return formatPodkladFileName(year, month)
    .replace(/Ł/g, 'L')
    .replace(/ł/g, 'l')
    .replace(/[^\x20-\x7E]/g, '_');
}

export function buildPodkladContentDisposition(fileName: string): string {
  const asciiFallback = fileName
    .replace(/Ł/g, 'L')
    .replace(/ł/g, 'l')
    .replace(/"/g, '')
    .replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function weekdayLabel(year: number, month: number, day: number): string {
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

function monthTitle(year: number, month: number): string {
  const name = MONTH_UPPER[month - 1];
  return name ? `${name} ${year}` : `${month}/${year}`;
}

function buildMerges(daysInMonth: number): XLSX.Range[] {
  const endTitleCol = 2 + 2 * daysInMonth;
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: endTitleCol }, e: { r: 1, c: endTitleCol + 1 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: endTitleCol }, e: { r: 4, c: endTitleCol } },
    { s: { r: 3, c: endTitleCol + 1 }, e: { r: 4, c: endTitleCol + 1 } },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const col = 2 * day;
    merges.push({ s: { r: 4, c: col }, e: { r: 4, c: col + 1 } });
  }

  return merges;
}

function appendShiftValueMerges(merges: XLSX.Range[], rows: string[][]): void {
  rows.forEach((row, rowIndex) => {
    if (row[3] !== '' || row[4] !== '') {
      merges.push({ s: { r: rowIndex, c: 3 }, e: { r: rowIndex, c: 4 } });
    }
  });
}

function buildSheetRows(year: number, month: number): string[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const title = monthTitle(year, month);
  const endTitleCol = 2 + 2 * daysInMonth;
  const totalCols = endTitleCol + 2;

  const emptyRow = () => Array.from({ length: totalCols }, () => '');

  const headerRow0 = emptyRow();
  headerRow0[0] = title;
  for (let day = 1; day <= daysInMonth; day++) {
    headerRow0[2 * day] = weekdayLabel(year, month, day);
  }
  headerRow0[endTitleCol] = title;

  const headerRow1 = emptyRow();
  for (let day = 1; day <= daysInMonth; day++) {
    headerRow1[2 * day] = String(day);
  }

  const nameRow = emptyRow();
  nameRow[0] = 'nazwisko';
  nameRow[1] = 'imię';
  nameRow[endTitleCol] = 'nazwisko';
  nameRow[endTitleCol + 1] = 'imię';

  const workerRow = emptyRow();
  const workerValuesRow = emptyRow();
  for (let day = 1; day <= daysInMonth; day++) {
    workerValuesRow[2 * day] = '0';
  }

  const rows: string[][] = [
    headerRow0,
    headerRow1,
    emptyRow(),
    nameRow,
    workerRow,
    workerValuesRow,
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ];

  for (const shift of SHIFT_ROWS) {
    if (shift.label) {
      const labelRow = emptyRow();
      labelRow[1] = shift.label;
      rows.push(labelRow);
    }

    if (shift.values) {
      const valueRow = emptyRow();
      if (shift.values.length === 2) {
        valueRow[3] = String(shift.values[0]);
        valueRow[4] = String(shift.values[1]);
      } else {
        valueRow[3] = String(shift.values[0]);
      }
      rows.push(valueRow);
    }
  }

  return rows;
}

export function generateSchedulePodkladBuffer(year: number, month: number): Buffer {
  const rows = buildSheetRows(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const merges = buildMerges(daysInMonth);
  appendShiftValueMerges(merges, rows);
  worksheet['!merges'] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Arkusz1');

  return Buffer.from(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }),
  );
}
