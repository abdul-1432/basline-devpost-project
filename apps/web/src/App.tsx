import React, { useEffect, useState } from 'react';
import { fetchToken, getFeatures, getTargets, getFeatureWithTargets, type FeatureInfo } from './api';
import { isStatic } from './api';

function FeatureCheck() {
  const [featureId, setFeatureId] = useState('css-has-pseudo-class');
  const [token, setToken] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  useEffect(() => { (async () => { const t = await fetchToken('demo'); setToken(t); const tg = await getTargets(t); setTargets(tg); })(); }, []);
  const run = async () => { if (!token) return; const r = await getFeatureWithTargets(token, featureId); setResult(r); };
  return (
    <div className="card">
      <div className="section-title">Interactive check</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="input" value={featureId} onChange={e => setFeatureId(e.target.value)} placeholder="feature id (e.g. css-has-pseudo-class)" style={{ flex: 1, minWidth: 240 }} />
        <button className="button" onClick={run}>Check</button>
      </div>
      <div style={{ color: '#8aa1c0', marginTop: 8 }}>Targets: {targets.join(', ') || '(none)'}</div>
      {result && (
        <div style={{ marginTop: 10 }}>
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
        setFeatures(list.slice(0, 60));
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container" style={{ color: 'salmon' }}>{error}</div>;

  return (
    <div>
      <div className="container nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="badge">Baseline</div>
          <b>Guardian</b>
        </div>
        {isStatic && <span className="badge">Demo mode (no backend)</span>}
      </div>

      <div className="container hero">
        <div>
          <h1>Ship modern web features with confidence</h1>
          <p>Baseline Guardian scans your code, enforces ESLint/Stylelint rules, and visualizes support across your targets — all powered by the Web Baseline dataset.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a className="cta" href="https://github.com/abdul-1432/basline-devpost-project" target="_blank" rel="noreferrer">View on GitHub</a>
            <a className="button" href="#demo">Try the demo</a>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Why Baseline?</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#8aa1c0' }}>
            <li>Single source of truth for web platform support</li>
            <li>CI-ready: SARIF reporting, PR comments, and Pages hosting</li>
            <li>MERN + TypeScript, Docker-ready</li>
          </ul>
        </div>
      </div>

      <div className="container" id="demo">
        <div className="grid">
          <div className="card">
            <div className="section-title">Top features</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {features.slice(0, 6).map(f => (
                <li key={f.id}>{f.name} {f.baseline ? <span className="badge" style={{ marginLeft: 8 }}>Baseline {f.baseline}</span> : null}</li>
              ))}
            </ul>
          </div>
          <FeatureCheck />
          <div className="card">
            <div className="section-title">CLI & Integrations</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#8aa1c0' }}>
              <li>baseline-cli — emit SARIF and markdown</li>
              <li>eslint-plugin-baseline — flag non‑Baseline APIs</li>
              <li>stylelint-plugin-baseline — CSS signals</li>
            </ul>
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 24 }}>Feature list</div>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Baseline</th>
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
      </div>

      <div className="container footer">© {new Date().getFullYear()} Baseline Guardian</div>
    </div>
  );
}
