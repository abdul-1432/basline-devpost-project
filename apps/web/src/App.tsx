import React, { useEffect, useState } from 'react';
import { fetchToken, getFeatures, getTargets, getFeatureWithTargets, type FeatureInfo } from './api';

function FeatureCheck() {
  const [featureId, setFeatureId] = useState('css-has-pseudo-class');
  const [token, setToken] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  useEffect(() => { (async () => { const t = await fetchToken('demo'); setToken(t); const tg = await getTargets(t); setTargets(tg); })(); }, []);
  const run = async () => { if (!token) return; const r = await getFeatureWithTargets(token, featureId); setResult(r); };
  return (
    <div style={{ margin: '16px 0', padding: 12, border: '1px solid #ccc' }}>
      <h3>Check a feature against your targets</h3>
      <div>Targets: {targets.join(', ') || '(none)'}</div>
      <input value={featureId} onChange={e => setFeatureId(e.target.value)} placeholder="feature id" style={{ width: 320, marginRight: 8 }} />
      <button onClick={run}>Check</button>
      {result && (
        <div style={{ marginTop: 8 }}>
          <div><b>{result.name}</b> — Baseline: {result.baseline} {result.coverage != null ? `(coverage ${result.coverage}%)` : ''}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await fetchToken('demo');
        const list = await getFeatures(token);
        setFeatures(list.slice(0, 100));
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Baseline Guardian</h1>
      <p>First 100 features from Baseline dataset (via API)</p>
      <FeatureCheck />
      <table>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>ID</th>
            <th style={{ textAlign: 'left' }}>Name</th>
            <th style={{ textAlign: 'left' }}>Baseline</th>
          </tr>
        </thead>
        <tbody>
          {features.map(f => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{f.name}</td>
              <td>{f.baseline ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
