import type { Holiday, ScheduleDayAssignment, ShiftTemplate, Worker } from '@scheduler/shared';

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
  workers: Worker[];
  mockWorkerDrafts?: boolean;
};

export type GenerateScheduleEngineResult = {
  jobId: string;
  status: 'completed' | 'failed';
  message: string;
  draftCount: number;
  holidayCount: number;
  workerCount: number;
  assignmentCount: number;
  totalSlotCount: number;
  solverStatus: 'optimal' | 'feasible' | 'infeasible';
  workers: Array<Record<string, unknown>>;
  assignments: Array<Record<string, unknown>>;
  preview: Record<string, unknown>;
  unassignedSlotIds: string[];
};

export type ExportGrafikPdfEngineRequest = {
  preview: Record<string, unknown>;
};

export type ExportGrafikPdfEngineResult = {
  fileName: string;
  contentBase64: string;
};
