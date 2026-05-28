export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

export function getSocketBaseUrl(): string | undefined {
  const url = import.meta.env.VITE_SOCKET_URL;
  return url || undefined;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl();
  return fetch(`${base}${path}`, init);
}
