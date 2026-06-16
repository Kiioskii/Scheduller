import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  GenerateScheduleEngineRequest,
  GenerateScheduleEngineResult,
} from './scheduler-engine.types';

export type PodkladTemplateResult = {
  buffer: Buffer;
  fileName: string;
  contentDisposition: string;
};

@Injectable()
export class SchedulerEngineService {
  private readonly logger = new Logger(SchedulerEngineService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchPodkladTemplate(
    year: number,
    month: number,
    holidayDates: string[] = [],
  ): Promise<PodkladTemplateResult> {
    const baseUrl = this.config.get<string>('SCHEDULER_ENGINE_URL')?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new ServiceUnavailableException('Scheduler engine URL is not configured');
    }

    const url = new URL('/internal/v1/files/podklad/template', baseUrl);
    url.searchParams.set('year', String(year));
    url.searchParams.set('month', String(month));
    if (holidayDates.length > 0) {
      url.searchParams.set('holiday_dates', holidayDates.join(','));
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const apiKey = this.config.get<string>('SCHEDULER_ENGINE_API_KEY');
    if (apiKey) {
      headers['X-Internal-Api-Key'] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (error) {
      this.logger.error('Scheduler engine request failed', error);
      throw new BadGatewayException('Nie udało się połączyć z serwisem scheduler-engine');
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.warn(`Scheduler engine responded ${response.status}: ${detail}`);
      throw new BadGatewayException('Serwis scheduler-engine zwrócił błąd');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName =
      response.headers.get('x-file-name') ??
      this.parseFileNameFromContentDisposition(response.headers.get('content-disposition')) ??
      `PODKLAD-${year}-${month}.xlsx`;
    const contentDisposition =
      response.headers.get('content-disposition') ??
      `attachment; filename="${fileName.replace(/[^\x20-\x7E]/g, '_')}"`;

    return { buffer, fileName, contentDisposition };
  }

  async generateSchedule(
    payload: GenerateScheduleEngineRequest,
  ): Promise<GenerateScheduleEngineResult> {
    const baseUrl = this.config.get<string>('SCHEDULER_ENGINE_URL')?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new ServiceUnavailableException('Scheduler engine URL is not configured');
    }

    const url = new URL('/internal/v1/schedules/generate', baseUrl);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const apiKey = this.config.get<string>('SCHEDULER_ENGINE_API_KEY');
    if (apiKey) {
      headers['X-Internal-Api-Key'] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error('Scheduler engine schedule generation failed', error);
      throw new BadGatewayException('Nie udało się połączyć z serwisem scheduler-engine');
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.warn(`Scheduler engine responded ${response.status}: ${detail}`);
      throw new BadGatewayException(
        'Serwis scheduler-engine zwrócił błąd podczas generowania grafiku',
      );
    }

    const json = (await response.json()) as GenerateScheduleEngineResult;
    return json;
  }

  private parseFileNameFromContentDisposition(header: string | null): string | null {
    if (!header) return null;
    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        return utf8Match[1];
      }
    }
    const asciiMatch = header.match(/filename="([^"]+)"/i);
    return asciiMatch?.[1] ?? null;
  }
}
