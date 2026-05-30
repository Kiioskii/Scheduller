const EXCEL_EXTENSIONS = ['.xlsx', '.xls'] as const;

export function isScheduleExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function filterScheduleExcelFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter(isScheduleExcelFile);
}
