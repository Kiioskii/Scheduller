import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseService } from '../../supabase/supabase.service';
import { DraftStorageService } from './draft-storage.service';

describe('DraftStorageService', () => {
  let service: DraftStorageService;
  let upload: jest.Mock;
  let download: jest.Mock;
  let remove: jest.Mock;

  beforeEach(async () => {
    upload = jest.fn().mockResolvedValue({ error: null });
    download = jest.fn();
    remove = jest.fn().mockResolvedValue({ error: null });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftStorageService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () =>
              ({
                storage: {
                  from: jest.fn(() => ({ upload, download, remove })),
                },
              }) as unknown as SupabaseClient,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => (key === 'SUPABASE_DRAFTS_BUCKET' ? 'drafts' : undefined)),
          },
        },
      ],
    }).compile();

    service = module.get(DraftStorageService);
  });

  it('uploads draft file to unique path in Supabase storage', async () => {
    const file = { buffer: Buffer.from('xlsx'), originalname: 'podklad.xlsx' };

    const storedDraft = await service.uploadWorkerDraft('42', 2026, 6, file);

    expect(storedDraft.fileName).toBe('podklad.xlsx');
    expect(storedDraft.storagePath).toMatch(/^42\/2026\/6\/[0-9a-f-]+\.xlsx$/i);
    expect(upload).toHaveBeenCalledWith(
      storedDraft.storagePath,
      file.buffer,
      expect.objectContaining({
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      }),
    );
  });

  it('throws when upload fails', async () => {
    upload.mockResolvedValue({ error: { message: 'bucket missing' } });

    await expect(
      service.uploadWorkerDraft('42', 2026, 6, {
        buffer: Buffer.from('xlsx'),
        originalname: 'podklad.xlsx',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('downloads draft file by storage path', async () => {
    download.mockResolvedValue({
      data: new Blob([Buffer.from('xlsx')]),
      error: null,
    });

    const result = await service.downloadWorkerDraftFile('42/2026/6/file.xlsx', 'podklad.xlsx');

    expect(result.fileName).toBe('podklad.xlsx');
    expect(result.buffer.toString()).toBe('xlsx');
  });
});
