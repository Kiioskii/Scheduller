import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import { SupabaseService } from '../../supabase/supabase.service';
import type { UploadFilePayload } from '../files/files.service';

export type StoredWorkerDraft = {
  storagePath: string;
  fileName: string;
};

@Injectable()
export class DraftStorageService {
  private static readonly DEFAULT_BUCKET = 'drafts';

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  buildObjectPath(workerId: string, year: number, month: number, objectName: string): string {
    return `${workerId}/${year}/${month}/${objectName}`;
  }

  buildStorageLocation(storagePath: string): string {
    return `${this.getBucketName()}/${storagePath}`;
  }

  async uploadWorkerDraft(
    workerId: string,
    year: number,
    month: number,
    file: UploadFilePayload,
  ): Promise<StoredWorkerDraft> {
    const supabase = this.supabaseService.getClient();
    const bucket = this.getBucketName();
    const objectName = this.buildUniqueObjectName(file.originalname);
    const storagePath = this.buildObjectPath(workerId, year, month, objectName);

    const { error } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
      contentType: this.resolveContentType(file.originalname),
      upsert: false,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      storagePath,
      fileName: file.originalname,
    };
  }

  async downloadWorkerDraftFile(
    storagePath: string,
    downloadName: string,
  ): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    const supabase = this.supabaseService.getClient();
    const bucket = this.getBucketName();

    const { data, error } = await supabase.storage.from(bucket).download(storagePath);

    if (error || !data) {
      throw new NotFoundException('Nie znaleziono pliku podkładu');
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    return {
      buffer,
      contentType: this.resolveContentType(downloadName),
      fileName: downloadName,
    };
  }

  async deleteWorkerDraftFile(storagePath: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const bucket = this.getBucketName();

    const { error } = await supabase.storage.from(bucket).remove([storagePath]);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private buildUniqueObjectName(originalName: string): string {
    const extension = originalName.toLowerCase().endsWith('.xls') ? '.xls' : '.xlsx';
    return `${randomUUID()}${extension}`;
  }

  private getBucketName(): string {
    return this.config.get<string>('SUPABASE_DRAFTS_BUCKET') ?? DraftStorageService.DEFAULT_BUCKET;
  }

  private resolveContentType(fileName: string): string {
    return fileName.toLowerCase().endsWith('.xls')
      ? 'application/vnd.ms-excel'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
}
