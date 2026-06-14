import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { Test, TestingModule } from '@nestjs/testing';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseService } from '../../supabase/supabase.service';
import { WorkersService } from '../workers/workers.service';
import { DraftStorageService } from './draft-storage.service';
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

function createStatusesSupabaseMock(receivedRows: unknown[]): SupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: receivedRows, error: null }),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

function createSubmitSupabaseMock(options: {
  insertError?: { message: string } | null;
}): SupabaseClient {
  const insert = jest.fn().mockResolvedValue({ error: options.insertError ?? null });

  return {
    from: jest.fn(() => ({
      insert,
    })),
  } as unknown as SupabaseClient;
}

describe('ReceivedSchedulesService', () => {
  let service: ReceivedSchedulesService;
  let getClient: jest.Mock<SupabaseClient>;
  let getWorkerById: jest.Mock;
  let uploadWorkerDraft: jest.Mock;

  beforeEach(async () => {
    getClient = jest.fn();
    getWorkerById = jest.fn();
    uploadWorkerDraft = jest.fn().mockResolvedValue({
      storagePath: '1/2026/6/draft-1.xlsx',
      fileName: 'podklad.xlsx',
    });

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
          provide: DraftStorageService,
          useValue: { uploadWorkerDraft },
        },
      ],
    }).compile();

    service = module.get(ReceivedSchedulesService);
  });

  it('merges workers with draft counts from Received_drafts rows', async () => {
    getClient.mockReturnValue(
      createStatusesSupabaseMock([
        { worker_id: 1, year: 2026, month: 6, recived: true },
        { worker_id: 1, year: 2026, month: 6, recived: true },
      ]),
    );

    const statuses = await service.getWorkerPodkladStatuses(2026, 6);

    expect(statuses).toEqual([
      expect.objectContaining({
        workerId: '1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        received: true,
        draftCount: 2,
      }),
      expect.objectContaining({
        workerId: '2',
        firstName: 'Anna',
        lastName: 'Nowak',
        received: false,
        draftCount: 0,
        deleted: true,
      }),
    ]);
  });

  it('ignores rows with recived=false when counting drafts', async () => {
    getClient.mockReturnValue(
      createStatusesSupabaseMock([
        { worker_id: 1, year: 2026, month: 6, recived: true },
        { worker_id: 1, year: 2026, month: 6, recived: false },
      ]),
    );

    const statuses = await service.getWorkerPodkladStatuses(2026, 6);

    expect(statuses[0]).toEqual(
      expect.objectContaining({
        workerId: '1',
        received: true,
        draftCount: 1,
      }),
    );
  });

  it('throws when Supabase query fails', async () => {
    getClient.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: { message: 'connection failed' },
            }),
          })),
        })),
      })),
    } as unknown as SupabaseClient);

    await expect(service.getWorkerPodkladStatuses(2026, 6)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  describe('submitWorkerDraft', () => {
    const file = {
      buffer: readFileSync('/Users/Maciej/Downloads/PODKŁAD 01.06-30.06 R (2).xlsx'),
      originalname: 'PODKŁAD 01.06-30.06 R (2).xlsx',
    };

    it('inserts received draft row for active worker', async () => {
      getWorkerById.mockResolvedValue(workers[0]);
      getClient.mockReturnValue(createSubmitSupabaseMock({}));

      const result = await service.submitWorkerDraft('1', 2026, 6, file);

      expect(result).toEqual({
        workerId: '1',
        year: 2026,
        month: 6,
        received: true,
      });
      expect(uploadWorkerDraft).toHaveBeenCalledWith('1', 2026, 6, file);
    });

    it('rejects deleted worker', async () => {
      getWorkerById.mockResolvedValue(workers[1]);

      await expect(service.submitWorkerDraft('2', 2026, 6, file)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
