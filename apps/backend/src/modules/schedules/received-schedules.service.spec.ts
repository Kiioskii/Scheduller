import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { SupabaseClient } from '@supabase/supabase-js';

import { FilesService } from '../files/files.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { WorkersService } from '../workers/workers.service';
import { ReceivedSchedulesService } from './received-schedules.service';

const workers = [
  {
    id: '1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    role: 'worker' as const,
    priority: 5,
    checker: false,
    deleted: false,
  },
  {
    id: '2',
    firstName: 'Anna',
    lastName: 'Nowak',
    role: 'boss' as const,
    priority: 1,
    checker: true,
    deleted: true,
  },
];

function createSupabaseClientMock(
  receivedResult: { data: unknown[]; error: { message: string } | null },
): SupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue(receivedResult),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

function createSubmitSupabaseMock(options: {
  existing?: boolean;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
}): SupabaseClient {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: options.existing ? { worker_id: 1 } : null,
    error: null,
  });
  const updateEqMonth = jest.fn().mockResolvedValue({ error: options.updateError ?? null });
  const updateEqYear = jest.fn(() => ({ eq: updateEqMonth }));
  const updateEqWorker = jest.fn(() => ({ eq: updateEqYear }));
  const update = jest.fn(() => ({ eq: updateEqWorker }));
  const insert = jest.fn().mockResolvedValue({ error: options.insertError ?? null });

  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle,
            })),
          })),
        })),
      })),
      update,
      insert,
    })),
  } as unknown as SupabaseClient;
}

describe('ReceivedSchedulesService', () => {
  let service: ReceivedSchedulesService;
  let getClient: jest.Mock<SupabaseClient>;
  let getWorkerById: jest.Mock;

  beforeEach(async () => {
    getClient = jest.fn();
    getWorkerById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceivedSchedulesService,
        {
          provide: SupabaseService,
          useValue: { getClient },
        },
        {
          provide: WorkersService,
          useValue: {
            getWorkers: jest.fn().mockResolvedValue(workers),
            getWorkerById,
          },
        },
        {
          provide: FilesService,
          useValue: {
            parseScheduleExcelFile: jest.fn().mockReturnValue({
              fileName: 'podklad.xlsx',
              sheetName: 'Sheet1',
              sheetNames: ['Sheet1'],
              rowCount: 10,
              year: 2026,
              month: 6,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ReceivedSchedulesService);
  });

  it('merges workers with received flags for the selected month', async () => {
    getClient.mockReturnValue(
      createSupabaseClientMock({
        data: [{ worker_id: 1, year: 2026, month: 6, recived: 1 }],
        error: null,
      }),
    );

    const statuses = await service.getWorkerPodkladStatuses(2026, 6);

    expect(statuses).toEqual([
      expect.objectContaining({
        workerId: '1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        received: true,
      }),
      expect.objectContaining({
        workerId: '2',
        firstName: 'Anna',
        lastName: 'Nowak',
        received: false,
        deleted: true,
      }),
    ]);
  });

  it('throws when Supabase query fails', async () => {
    getClient.mockReturnValue(
      createSupabaseClientMock({
        data: [],
        error: { message: 'connection failed' },
      }),
    );

    await expect(service.getWorkerPodkladStatuses(2026, 6)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  describe('submitWorkerDraft', () => {
    const file = { buffer: Buffer.from('xlsx'), originalname: 'podklad.xlsx' };

    it('inserts received draft for active worker', async () => {
      getWorkerById.mockResolvedValue(workers[0]);
      getClient.mockReturnValue(createSubmitSupabaseMock({ existing: false }));

      const result = await service.submitWorkerDraft('1', 2026, 6, file);

      expect(result).toEqual({
        workerId: '1',
        year: 2026,
        month: 6,
        received: true,
      });
    });

    it('rejects deleted worker', async () => {
      getWorkerById.mockResolvedValue(workers[1]);

      await expect(service.submitWorkerDraft('2', 2026, 6, file)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
