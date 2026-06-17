import type { Holiday, ScheduleDayAssignment, ShiftTemplate } from '@scheduler/shared';

export type WorkerDraftPayload = {
  draftId: string;
  workerId: string;
  fileName: string;
  contentBase64: string;
};

export type GenerateScheduleEngineRequest = {
  year: number;
  month: number;
  dayAssignments: ScheduleDayAssignment[];
  holidays: Holiday[];
  shiftTemplates: ShiftTemplate[];
  workerDrafts: WorkerDraftPayload[];
};

export type GenerateScheduleEngineResult = {
  jobId: string;
  status: 'accepted';
  message: string;
  draftCount: number;
  holidayCount: number;
};
