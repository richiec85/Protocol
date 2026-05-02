import { StravaConfig, Activity } from '../types';
import { uid } from '../utils';

const STRAVA_API_BASE = 'https://www.strava.com';

export function stravaAuth(workerUrl: string): void {
  const redirect = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/') + 'index.html';
  window.location.href = `${workerUrl.replace(/\/$/, '')}/authorize?redirect_uri=${encodeURIComponent(redirect)}`;
}

export async function stravaFetch(workerUrl: string, refreshToken: string, path: string): Promise<any> {
  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error(`Strava error: ${res.status}`);
  }

  return res.json();
}

export async function stravaPullActivities(
  workerUrl: string,
  refreshToken: string,
  sinceTs: number | null,
  onProgress?: (loaded: number, page: number) => void
): Promise<Omit<Activity, 'id' | 'source'>[]> {
  const after = sinceTs
    ? Math.floor(sinceTs / 1000)
    : Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 365 * 5) / 1000);

  const all: any[] = [];
  let page = 1;

  while (page <= 50) {
    if (onProgress) onProgress(all.length, page);

    const batch = await stravaFetch(
      workerUrl,
      refreshToken,
      `/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`
    );

    if (!Array.isArray(batch) || !batch.length) break;

    all.push(...batch);
    if (batch.length < 100) break;

    page++;
  }

  return all.map((a: any) => ({
    stravaId: a.id,
    date: a.start_date_local ? a.start_date_local.slice(0, 10) : a.start_date.slice(0, 10),
    type: a.sport_type || a.type,
    name: a.name,
    durationMin: Math.round((a.moving_time || 0) / 60),
    distanceKm: +(((a.distance || 0) / 1000).toFixed(2)),
    kj: a.kilojoules ? Math.round(a.kilojoules) : null,
  }));
}

export function isStravaConfigured(cfg: StravaConfig): boolean {
  return !!cfg.workerUrl && !!cfg.refreshToken;
}
