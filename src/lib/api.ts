const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const token = localStorage.getItem('farmshare_access_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(getApiUrl(path), { ...options, headers });
  let data: any = null;
  try { data = await response.json(); } catch { /* empty response */ }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }
  return data as T;
}
