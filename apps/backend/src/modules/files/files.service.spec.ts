import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

import { FilesService } from './files.service';

function createWorkersSheetBuffer(rows: Record<string, string>[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pracownicy');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
  });

  describe('parseWorkersFile', () => {
    it('parses workers with default priority, role and checker', () => {
      const buffer = createWorkersSheetBuffer([
        { Imię: 'Jan', Nazwisko: 'Kowalski' },
        { Imię: 'Anna', Nazwisko: 'Nowak' },
      ]);

      const workers = service.parseWorkersFile(buffer);

      expect(workers).toHaveLength(2);
      expect(workers[0]).toEqual({
        firstName: 'Jan',
        lastName: 'Kowalski',
        role: 'worker',
        priority: 5,
        checker: true,
      });
      expect(workers[1]).toMatchObject({
        firstName: 'Anna',
        lastName: 'Nowak',
        priority: 5,
      });
    });

    it('uses priority from optional column', () => {
      const buffer = createWorkersSheetBuffer([
        { Imię: 'Jan', Nazwisko: 'Kowalski', Priorytet: '8' },
      ]);

      const workers = service.parseWorkersFile(buffer);

      expect(workers[0]?.priority).toBe(8);
    });

    it('skips completely empty rows', () => {
      const buffer = createWorkersSheetBuffer([
        { Imię: 'Jan', Nazwisko: 'Kowalski' },
        { Imię: '', Nazwisko: '' },
        { Imię: 'Ewa', Nazwisko: 'Wiśniewska' },
      ]);

      const workers = service.parseWorkersFile(buffer);

      expect(workers).toHaveLength(2);
    });

    it('throws when buffer is empty', () => {
      expect(() => service.parseWorkersFile(Buffer.alloc(0))).toThrow(BadRequestException);
      expect(() => service.parseWorkersFile(Buffer.alloc(0))).toThrow('Plik jest pusty');
    });

    it('throws when sheet has no data rows', () => {
      const worksheet = XLSX.utils.aoa_to_sheet([['Imię', 'Nazwisko']]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pusty');
      const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

      expect(() => service.parseWorkersFile(buffer)).toThrow('Plik nie zawiera wierszy danych');
    });

    it('throws when row is missing first or last name', () => {
      const buffer = createWorkersSheetBuffer([{ Imię: 'Jan', Nazwisko: '' }]);

      try {
        service.parseWorkersFile(buffer);
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: string;
          errors: string[];
        };
        expect(response.message).toBe('Błędy w pliku importu');
        expect(response.errors[0]).toContain('Wiersz 2');
        expect(response.errors[0]).toContain('Imię');
      }
    });

    it('throws when names fail schema validation', () => {
      const buffer = createWorkersSheetBuffer([{ Imię: 'J', Nazwisko: 'K' }]);

      try {
        service.parseWorkersFile(buffer);
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as { errors: string[] };
        expect(response.errors[0]).toMatch(/^Wiersz 2:/);
      }
    });

    it('throws when file has only empty worker rows', () => {
      const buffer = createWorkersSheetBuffer([
        { Imię: '', Nazwisko: '' },
        { Imię: '  ', Nazwisko: '  ' },
      ]);

      expect(() => service.parseWorkersFile(buffer)).toThrow('Nie znaleziono pracowników w pliku');
    });
  });
});
