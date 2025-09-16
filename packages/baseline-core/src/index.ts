import { createRequire } from "module";

const require = createRequire(import.meta.url);

export type BaselineSupport = "high" | "medium" | "low" | "unknown";

export interface FeatureInfo {
  id: string;
  name: string;
  description?: string;
  baseline?: string; // e.g. "2024" or "widely available"
  status?: string;
}

export interface EvaluationResult {
  featureId: string;
  name: string;
  baseline: BaselineSupport;
  message: string;
}

export interface TargetsEvaluation extends EvaluationResult {
  targets: string[];
  coverage?: number; // percentage 0-100 for targets
  perTarget?: Record<string, "y" | "a" | "n" | "u" | "p">; // p: partial prefix
}

function loadFeaturesSync(): any[] {
  try {
    // Preferred JSON data path
    const data = require("web-features/data/features.json");
    const payload = (data?.default ?? data);
    if (Array.isArray(payload)) return payload as any[];
    if (payload && Array.isArray(payload.features)) return payload.features as any[];
  } catch {}
  try {
    const mod = require("web-features");
    const payload = (mod?.default ?? mod);
    if (Array.isArray(payload)) return payload as any[];
    if (payload && Array.isArray(payload.features)) return payload.features as any[];
  } catch {}
  // Fallback minimal set so the tool still works offline
  return [
    { id: "css-view-transitions", name: "View Transitions", status: { baseline: null } },
    { id: "html-popover-attribute", name: "Popover attribute", status: { baseline: null } },
    { id: "css-has-pseudo-class", name: ":has() pseudo-class", status: { baseline: null } },
  ];
}

// Cache features in-memory
let _featuresCache: any[] | null = null;
function getFeatures(): any[] {
  if (!_featuresCache) _featuresCache = loadFeaturesSync();
  return _featuresCache;
}

// Very lightweight evaluator: mark features with baseline flag as high,
// else unknown; extend later to consider engines/versions and Baseline year.
export function evaluateFeatureSupport(featureId: string): EvaluationResult | null {
  const features = getFeatures();
  const f = (features as any[]).find((x) => x.id === featureId);
  if (!f) return null;
  let support: BaselineSupport = "unknown";
  let message = "";
  if (f.status?.baseline) {
    support = "high";
    message = `Baseline: ${f.status.baseline}`;
  } else {
    support = "unknown";
    message = "No Baseline designation found";
  }
  return { featureId: f.id, name: f.name ?? f.id, baseline: support, message };
}

export function listFeatures(): FeatureInfo[] {
  const features = getFeatures();
  return (features as any[]).map((f) => ({
    id: f.id,
    name: f.name ?? f.id,
    description: (f as any).description,
    baseline: f.status?.baseline,
    status: f.status?.maturity ?? f.status?.baseline,
  }));
}

// Helpful links
const featureLinks: Record<string, { mdn?: string; caniuse?: string }> = {
  "css-has-pseudo-class": {
    mdn: "https://developer.mozilla.org/docs/Web/CSS/:has",
    caniuse: "https://caniuse.com/css-has"
  },
  "html-popover-attribute": {
    mdn: "https://developer.mozilla.org/docs/Web/HTML/Global_attributes/popover",
    caniuse: "https://caniuse.com/?search=popover"
  },
  "css-view-transitions": {
    mdn: "https://developer.mozilla.org/docs/Web/API/View_Transitions_API",
    caniuse: "https://caniuse.com/view-transitions"
  }
};

export function getFeatureLinks(featureId: string): { mdn?: string; caniuse?: string } | undefined {
  return featureLinks[featureId];
}

// --- My Baseline (targets-aware) ---
import browserslist from "browserslist";

export function getProjectTargets(cwd?: string): string[] {
  try {
    const path = cwd || process.cwd();
    const config = (browserslist as any).loadConfig?.({ path }) as any;
    const result: string[] = (browserslist as any)(config || undefined, { path });
    return result;
  } catch {
    return (browserslist as any)(undefined, { path: cwd || process.cwd() });
  }
}

// Map our feature ids to caniuse keys for coverage computation
const featureToCaniuse: Record<string, string> = {
  "css-has-pseudo-class": "css-has",
  "html-popover-attribute": "popover",
  "css-view-transitions": "view-transitions"
};

function loadCaniuseFeature(key: string): any | null {
  try {
    const data = require(`caniuse-lite/data/features/${key}.js`);
    return data?.default ?? data;
  } catch {
    return null;
  }
}

function pickNearestVersion(stats: Record<string, string>, ver: string): string | null {
  if (stats[ver] != null) return ver;
  // Try progressively trimming patch/minor
  const asNum = (v: string) => v.split(".").map(n => parseInt(n, 10));
  const target = asNum(ver);
  const candidates = Object.keys(stats)
    .map(v => ({ v, parts: asNum(v) }))
    .filter(x => x.parts[0] <= target[0])
    .sort((a,b) => (a.parts[0]-b.parts[0]) || ((a.parts[1]||0)-(b.parts[1]||0)) || ((a.parts[2]||0)-(b.parts[2]||0)));
  let best: string | null = null;
  for (const c of candidates) {
    if (c.parts[0] < target[0]) best = c.v; else {
      const cm = (c.parts[1]||0) <= (target[1]||0);
      const cp = (c.parts[2]||0) <= (target[2]||0);
      if (cm && cp) best = c.v; else break;
    }
  }
  return best;
}

function normalizeStatus(s: string): "y"|"a"|"n"|"u"|"p" {
  // statuses may include flags like "y #2" or "a x"
  const ch = s.trim()[0];
  if (ch === 'y') return 'y';
  if (ch === 'a') return 'a';
  if (ch === 'n') return 'n';
  if (ch === 'u') return 'u';
  return 'p';
}

export function computeCoverageForTargets(featureId: string, targets: string[]): { coverage: number, perTarget: Record<string, "y"|"a"|"n"|"u"|"p"> } | null {
  const key = featureToCaniuse[featureId];
  if (!key) return null;
  const feat = loadCaniuseFeature(key);
  if (!feat) return null;
  const rawStats = (feat as any).stats ?? (feat as any).data?.stats;
  if (!rawStats) return null;
  const stats = rawStats as Record<string, Record<string,string>>; // agent -> version -> status
  const perTarget: Record<string, "y"|"a"|"n"|"u"|"p"> = {};
  let supported = 0;
  let total = 0;
  for (const tgt of targets) {
    const [agent, version] = tgt.split(" ");
    const agentStats = stats[agent];
    if (!agentStats) { perTarget[tgt] = 'u'; total++; continue; }
    const nearest = pickNearestVersion(agentStats, version) ?? Object.keys(agentStats).pop() ?? null;
    if (!nearest) { perTarget[tgt] = 'u'; total++; continue; }
    const st = normalizeStatus(agentStats[nearest]);
    perTarget[tgt] = st;
    total++;
    if (st === 'y' || st === 'a') supported++;
  }
  const coverage = total > 0 ? Math.round((supported / total) * 100) : 0;
  return { coverage, perTarget };
}

export function evaluateForTargets(featureId: string, targets: string[]): TargetsEvaluation | null {
  const base = evaluateFeatureSupport(featureId);
  if (!base) return null;
  const cov = computeCoverageForTargets(featureId, targets);
  return { ...base, targets, coverage: cov?.coverage, perTarget: cov?.perTarget };
}
