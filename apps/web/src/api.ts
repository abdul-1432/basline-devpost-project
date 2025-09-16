export interface FeatureInfo { id: string; name: string; baseline?: string; }

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export async function fetchToken(user = 'demo'): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user }) });
  const data = await res.json();
  return data.token as string;
}

export async function getFeatures(token: string): Promise<FeatureInfo[]> {
  const res = await fetch(`${API_URL}/features`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function getTargets(token: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/targets`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.targets as string[];
}

export async function getFeatureWithTargets(token: string, id: string): Promise<any> {
  const res = await fetch(`${API_URL}/features/${id}?useTargets=true`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}
