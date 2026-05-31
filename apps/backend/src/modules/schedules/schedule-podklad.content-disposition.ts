/** Fallback when proxying podkład download without engine Content-Disposition header. */

export function buildPodkladContentDisposition(fileName: string): string {
  const asciiFallback = fileName
    .replace(/Ł/g, 'L')
    .replace(/ł/g, 'l')
    .replace(/"/g, '')
    .replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
