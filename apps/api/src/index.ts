import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { evaluateFeatureSupport, listFeatures, getProjectTargets, evaluateForTargets, getFeatureLinks } from '@baseline-guardian/baseline-core';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(req: any, res: any, next: any) {
  const authz = req.headers.authorization;
  if (!authz?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = authz.slice('Bearer '.length);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/token', (req, res) => {
  const { user = 'demo' } = req.body || {};
  const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

app.get('/targets', auth, (_req, res) => {
  const targets = getProjectTargets(process.cwd());
  res.json({ targets });
});

app.get('/features', auth, (_req, res) => {
  res.json(listFeatures());
});

app.get('/features/:id', auth, (req, res) => {
  const useTargets = req.query.useTargets === 'true';
  if (useTargets) {
    const targets = getProjectTargets(process.cwd());
    const r = evaluateForTargets(req.params.id, targets);
    if (!r) return res.status(404).json({ error: 'Not found' });
    return res.json({ ...r, links: getFeatureLinks(req.params.id) });
  }
  const r = evaluateFeatureSupport(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ...r, links: getFeatureLinks(req.params.id) });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
