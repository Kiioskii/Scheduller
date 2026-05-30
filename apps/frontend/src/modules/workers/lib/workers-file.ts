const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

export function isWorkersFileAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}
