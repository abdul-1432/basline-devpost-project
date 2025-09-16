export interface FeatureInfo { id: string; name: string; baseline?: string; }

// API base URL comes from build-time env. If missing or pointing to localhost,
// we switch to a static "demo" mode so the site works on GitHub Pages without a backend.
const RAW_API_URL: string | undefined = (import.meta as any).env?.VITE_API_URL;
const API_URL = RAW_API_URL?.trim();
export const isStatic = !API_URL || /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_URL);

// Minimal demo data used when running in static mode (GitHub Pages)
const DEMO_FEATURES: FeatureInfo[] = [
  { id: 'css-has-pseudo-class', name: ':has() pseudo-class', baseline: '2023' },
  { id: 'view-transitions', name: 'View Transitions API', baseline: undefined },
  { id: 'css-nesting', name: 'CSS Nesting', baseline: '2024' },
  { id: 'import-maps', name: 'Import Maps', baseline: undefined },
  { id: 'web-animations', name: 'Web Animations', baseline: undefined },
];

export async function fetchToken(user = 'demo'): Promise<string> {
  if (isStatic) return 'static';
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user }),
  });
  const data = await res.json();
  return data.token as string;
}

export async function getFeatures(token: string): Promise<FeatureInfo[]> {
  if (isStatic) return DEMO_FEATURES;
  const res = await fetch(`${API_URL}/features`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function getTargets(token: string): Promise<string[]> {
  if (isStatic) return [];
  const res = await fetch(`${API_URL}/targets`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return data.targets as string[];
}

export async function getFeatureWithTargets(token: string, id: string): Promise<any> {
  if (isStatic) {
    const match = DEMO_FEATURES.find(f => f.id === id);
    return { name: match?.name ?? id, baseline: match?.baseline ?? '-', coverage: null };
  }
  const res = await fetch(`${API_URL}/features/${id}?useTargets=true`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}
