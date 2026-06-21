import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { SupabaseClient } from '@supabase/supabase-js';

import { FilesService } from '../files/files.service';
import { SupabaseService } from '../../supabase/supabase.service';
import type { WorkerRow } from './workers.mapper';
import { WorkersService } from './workers.service';

const sampleRow: WorkerRow = {
  id: 1,
  first_name: 'Jan',
  last_name: 'Kowalski',
  role: 'worker',
  priority: 5,
  checker: true,
  available_as_worker: true,
  deleted: false,
};

type QueryResult<T> = { data: T; error: { message: string } | null };

function createSupabaseClientMock(handlers: {
  selectWorkers?: QueryResult<WorkerRow[]>;
  insertWorker?: QueryResult<WorkerRow>;
  updateWorker?: QueryResult<WorkerRow | null>;
}): SupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn().mockResolvedValue(
            handlers.selectWorkers ?? { data: [], error: null },
          ),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue(
            handlers.insertWorker ?? { data: sampleRow, error: null },
          ),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue(
              handlers.updateWorker ?? { data: sampleRow, error: null },
            ),
          })),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe('WorkersService', () => {
  let service: WorkersService;
  let filesService: FilesService;
  let supabaseClient: SupabaseClient;
  let getClient: jest.Mock<SupabaseClient>;

  beforeEach(async () => {
    supabaseClient = createSupabaseClientMock({});
    getClient = jest.fn(() => supabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        FilesService,
        {
          provide: SupabaseService,
          useValue: { getClient },
        },
      ],
    }).compile();

    service = module.get(WorkersService);
    filesService = module.get(FilesService);
  });

  describe('parseWorkersFromFile', () => {
    it('delegates parsing to FilesService', () => {
      const buffer = Buffer.from('test');
      const parsed = [
        {
          firstName: 'Jan',
          lastName: 'Kowalski',
          role: 'worker' as const,
          priority: 5,
          checker: true,
        },
      ];
      jest.spyOn(filesService, 'parseWorkersFile').mockReturnValue(parsed);

      expect(service.parseWorkersFromFile(buffer)).toEqual(parsed);
      expect(filesService.parseWorkersFile).toHaveBeenCalledWith(buffer);
    });
  });

  describe('getWorkers', () => {
    it('returns workers mapped from database rows', async () => {
      supabaseClient = createSupabaseClientMock({
        selectWorkers: { data: [sampleRow], error: null },
      });
      getClient.mockReturnValue(supabaseClient);

      const workers = await service.getWorkers();

      expect(workers).toEqual([
        {
          id: '1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          role: 'worker',
          priority: 5,
          checker: true,
          availableAsWorker: true,
          deleted: false,
        },
      ]);
      expect(supabaseClient.from).toHaveBeenCalledWith('Workers');
    });

    it('throws InternalServerErrorException when Supabase returns error', async () => {
      supabaseClient = createSupabaseClientMock({
        selectWorkers: { data: [], error: { message: 'connection failed' } },
      });
      getClient.mockReturnValue(supabaseClient);

      await expect(service.getWorkers()).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('createWorker', () => {
    it('creates worker with valid input', async () => {
      const insertedRow: WorkerRow = {
        ...sampleRow,
        first_name: 'Anna',
        last_name: 'Nowak',
        priority: 7,
        checker: false,
      };
      supabaseClient = createSupabaseClientMock({
        insertWorker: { data: insertedRow, error: null },
      });
      getClient.mockReturnValue(supabaseClient);

      const worker = await service.createWorker({
        firstName: 'Anna',
        lastName: 'Nowak',
        role: 'worker',
        priority: 7,
        checker: false,
      });

      expect(worker).toMatchObject({
        id: '1',
        firstName: 'Anna',
        lastName: 'Nowak',
        priority: 7,
        checker: false,
      });
      expect(supabaseClient.from).toHaveBeenCalledWith('Workers');
    });

    it('throws BadRequestException for invalid input', async () => {
      await expect(
        service.createWorker({
          firstName: 'A',
          lastName: 'Nowak',
          role: 'worker',
          priority: 5,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws InternalServerErrorException when insert fails', async () => {
      supabaseClient = createSupabaseClientMock({
        insertWorker: { data: sampleRow, error: { message: 'duplicate key' } },
      });
      getClient.mockReturnValue(supabaseClient);

      await expect(
        service.createWorker({
          firstName: 'Anna',
          lastName: 'Nowak',
          role: 'worker',
          priority: 5,
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateWorker', () => {
    it('updates worker with valid patch', async () => {
      const updatedRow: WorkerRow = { ...sampleRow, priority: 9, checker: false };
      supabaseClient = createSupabaseClientMock({
        updateWorker: { data: updatedRow, error: null },
      });
      getClient.mockReturnValue(supabaseClient);

      const worker = await service.updateWorker('1', { priority: 9, checker: false });

      expect(worker.priority).toBe(9);
      expect(worker.checker).toBe(false);
    });

    it('throws BadRequestException when body is invalid', async () => {
      await expect(service.updateWorker('1', { priority: 99 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when patch is empty after validation edge', async () => {
      await expect(service.updateWorker('1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when worker does not exist', async () => {
      supabaseClient = createSupabaseClientMock({
        updateWorker: { data: null, error: null },
      });
      getClient.mockReturnValue(supabaseClient);

      await expect(service.updateWorker('999', { priority: 3 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException when update fails', async () => {
      supabaseClient = createSupabaseClientMock({
        updateWorker: { data: null, error: { message: 'db error' } },
      });
      getClient.mockReturnValue(supabaseClient);

      await expect(service.updateWorker('1', { priority: 3 })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
