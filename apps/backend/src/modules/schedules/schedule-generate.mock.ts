import { randomUUID } from 'node:crypto';

import { generateScheduleResultSchema, type GenerateScheduleResult } from '@scheduler/shared';

const WEEKDAY_LABELS = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'] as const;

type PreviewFill = 'none' | 'yellow' | 'purple';

type MockHalfCell = { text: string | null; fill: PreviewFill };
type MockDayCell = { start: MockHalfCell; end: MockHalfCell };

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function weekdayLabel(year: number, month: number, day: number): string {
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

function emptyDayCell(): MockDayCell {
  return {
    start: { text: null, fill: 'none' },
    end: { text: null, fill: 'none' },
  };
}

function assignedDayCell(start: string, end: string): MockDayCell {
  return {
    start: { text: start, fill: 'none' },
    end: { text: end, fill: 'none' },
  };
}

function availabilityDayCell(fill: 'yellow' | 'purple' | 'both'): MockDayCell {
  return {
    start: {
      text: null,
      fill: fill === 'purple' ? 'none' : 'yellow',
    },
    end: {
      text: null,
      fill: fill === 'yellow' ? 'none' : 'purple',
    },
  };
}

function buildWorkerRow(daysInMonth: number, dayValues: Array<MockDayCell | null>) {
  const row = Array.from({ length: daysInMonth }, () => emptyDayCell());
  dayValues.forEach((value, index) => {
    if (value) {
      row[index] = value;
    }
  });
  return row;
}

export function buildMockGenerateScheduleResult(year: number, month: number): GenerateScheduleResult {
  const daysInMonth = getDaysInMonth(year, month);
  const weekdays = Array.from({ length: daysInMonth }, (_, index) =>
    weekdayLabel(year, month, index + 1),
  );
  const dayNumbers = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const preview = {
    year,
    month,
    daysInMonth,
    weekdays,
    dayNumbers,
    workers: [
      {
        workerId: 'mock-1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        rows: [
          buildWorkerRow(daysInMonth, [
            null,
            assignedDayCell('8,00', '15,15'),
            assignedDayCell('15,00', '22,00'),
            null,
            availabilityDayCell('yellow'),
            availabilityDayCell('purple'),
          ]),
        ],
      },
      {
        workerId: 'mock-2',
        firstName: 'Anna',
        lastName: 'Nowak',
        rows: [
          buildWorkerRow(daysInMonth, [
            null,
            null,
            assignedDayCell('8,00', '15,15'),
            assignedDayCell('8,00', '15,15'),
            null,
            null,
            null,
            null,
            null,
            availabilityDayCell('both'),
          ]),
        ],
      },
      {
        workerId: 'mock-3',
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        rows: [
          buildWorkerRow(daysInMonth, [
            null,
            assignedDayCell('8,00', '15,15'),
            null,
            availabilityDayCell('yellow'),
            availabilityDayCell('yellow'),
          ]),
          buildWorkerRow(daysInMonth, [
            null,
            null,
            assignedDayCell('15,00', '22,00'),
          ]),
        ],
      },
    ],
  };

  return generateScheduleResultSchema.parse({
    jobId: randomUUID(),
    year,
    month,
    status: 'accepted',
    draftCount: 3,
    holidayCount: 1,
    assignmentCount: 6,
    totalSlotCount: 6,
    solverStatus: 'optimal',
    message: 'Mock schedule generated for UI preview',
    preview,
    unassignedSlotIds: [],
  });
}

export function isScheduleGenerateMockEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/** Synthetic podkłady for all active workers — runs real solver (recommended for dev). */
export function shouldUseMockWorkerDrafts(config: {
  get: (key: string) => string | undefined;
}): boolean {
  return (
    isScheduleGenerateMockEnabled(config.get('SCHEDULE_MOCK_WORKER_DRAFTS')) ||
    isScheduleGenerateMockEnabled(config.get('SCHEDULE_GENERATE_MOCK'))
  );
}
