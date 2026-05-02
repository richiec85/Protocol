import { GitHubConfig, AppState } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export async function ghGet(cfg: GitHubConfig): Promise<{ content: AppState | null; sha: string | null }> {
    const url = `${GITHUB_API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/data.json`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${cfg.token}`,
            Accept: 'application/vnd.github+json',
        },
    });

    if (res.status === 404) {
        return { content: null, sha: null };
    }

    if (!res.ok) {
        throw new Error(`GitHub GET failed: ${res.status}`);
    }

    const j = await res.json();

    if (!j.content) {
        return { content: null, sha: j.sha || null };
    }

    try {
        const raw = atob(j.content.replace(/\n/g, ''));
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }
        const decoded = JSON.parse(new TextDecoder().decode(bytes));
        return { content: decoded, sha: j.sha };
    } catch {
        return { content: null, sha: j.sha || null };
    }
}

export async function ghPut(cfg: GitHubConfig, data: AppState, sha: string | null): Promise<string> {
    if (!sha) {
        try {
            const g = await ghGet(cfg);
            sha = g.sha;
        } catch {}
    }

    const url = `${GITHUB_API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/data.json`;
    const body = {
        message: `sync: ${new Date().toISOString()}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        ...(sha && { sha }),
    };

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${cfg.token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `GitHub PUT failed: ${res.status}`);
    }

    const j = await res.json();
    return j.content.sha;
}

export function isGitHubConfigured(cfg: GitHubConfig): boolean {
    return !!cfg.owner && !!cfg.repo && !!cfg.token;
}
