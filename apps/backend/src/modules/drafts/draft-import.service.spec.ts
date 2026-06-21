import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { parsePodkladDraftContent } from '../files/podklad-draft.parser';
import { WorkersService } from '../workers/workers.service';
import { DraftImportService } from './draft-import.service';
import { ReceivedSchedulesService } from './received-schedules.service';
import {
  createSamplePodkladFixture,
  SAMPLE_PODKLAD_FILE_NAME,
} from '../../test/fixtures/sample-podklad';

const workers = [
  {
    id: '1',
    firstName: 'Maciej',
    lastName: 'Kijowski',
    role: 'worker' as const,
    priority: 5,
    checker: false,
    availableAsWorker: true,
    deleted: false,
  },
  {
    id: '2',
    firstName: 'Anna',
    lastName: 'Nowak',
    role: 'boss' as const,
    priority: 1,
    checker: true,
    availableAsWorker: true,
    deleted: false,
  },
];

describe('parsePodkladDraftContent', () => {
  it('reads worker name and month from sample podklad', () => {
    const { buffer } = createSamplePodkladFixture();
    const parsed = parsePodkladDraftContent(SAMPLE_PODKLAD_FILE_NAME, buffer);

    expect(parsed).toEqual({
      fileName: SAMPLE_PODKLAD_FILE_NAME,
      firstName: 'Maciej',
      lastName: 'Kijowski',
      year: 2026,
      month: 6,
    });
  });
});

describe('DraftImportService', () => {
  let service: DraftImportService;
  let saveWorkerDraft: jest.Mock;
  let createWorker: jest.Mock;
  let getWorkerById: jest.Mock;

  beforeEach(async () => {
    saveWorkerDraft = jest.fn().mockResolvedValue(undefined);
    createWorker = jest.fn();
    getWorkerById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftImportService,
        {
          provide: WorkersService,
          useValue: {
            getWorkers: jest.fn().mockResolvedValue(workers),
            getWorkerById,
            createWorker,
          },
        },
        {
          provide: ReceivedSchedulesService,
          useValue: {
            assertYearMonth: jest.fn((year: number, month: number) => ({ year, month })),
            saveWorkerDraft,
          },
        },
      ],
    }).compile();

    service = module.get(DraftImportService);
  });

  it('matches podklad to worker without saving', async () => {
    const { buffer, originalname } = createSamplePodkladFixture();
    const result = await service.analyzeDraftFiles([{ buffer, originalname }], 2026, 6);

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]?.worker.id).toBe('1');
    expect(result.unmatched).toHaveLength(0);
    expect(saveWorkerDraft).not.toHaveBeenCalled();
  });

  it('returns unmatched when name does not match any worker', async () => {
    const { buffer, originalname } = createSamplePodkladFixture();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DraftImportService,
        {
          provide: WorkersService,
          useValue: {
            getWorkers: jest.fn().mockResolvedValue([workers[1]]),
            getWorkerById: jest.fn(),
            createWorker: jest.fn(),
          },
        },
        {
          provide: ReceivedSchedulesService,
          useValue: {
            assertYearMonth: jest.fn((year: number, month: number) => ({ year, month })),
            saveWorkerDraft: jest.fn(),
          },
        },
      ],
    }).compile();
    const localService = moduleRef.get(DraftImportService);

    const result = await localService.analyzeDraftFiles([{ buffer, originalname }], 2026, 6);

    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
  });

  it('confirms matched draft and marks received', async () => {
    const { buffer, originalname } = createSamplePodkladFixture();
    getWorkerById.mockResolvedValue(workers[0]);

    const result = await service.confirmDraftImports([{ buffer, originalname }], {
      year: 2026,
      month: 6,
      assignments: [{ clientId: '0', kind: 'existing', workerId: '1' }],
    });

    expect(result.saved).toBe(1);
    expect(saveWorkerDraft).toHaveBeenCalledWith('1', 2026, 6, {
      buffer,
      originalname,
    });
  });

  it('creates worker when assignment kind is new', async () => {
    const { buffer, originalname } = createSamplePodkladFixture();
    createWorker.mockResolvedValue({
      id: '3',
      firstName: 'Jan',
      lastName: 'Nowy',
      role: 'worker',
      priority: 5,
      checker: false,
      deleted: false,
    });

    await service.confirmDraftImports([{ buffer, originalname }], {
      year: 2026,
      month: 6,
      assignments: [
        {
          clientId: '0',
          kind: 'new',
          worker: {
            firstName: 'Jan',
            lastName: 'Nowy',
            role: 'worker',
            priority: 5,
          },
        },
      ],
    });

    expect(createWorker).toHaveBeenCalled();
    expect(saveWorkerDraft).toHaveBeenCalledWith('3', 2026, 6, {
      buffer,
      originalname,
    });
  });

  it('rejects month mismatch', async () => {
    const { buffer } = createSamplePodkladFixture();

    await expect(
      service.analyzeDraftFiles([{ buffer, originalname: 'podklad.xlsx' }], 2026, 5),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
