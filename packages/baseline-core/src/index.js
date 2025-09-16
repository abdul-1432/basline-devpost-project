import { createRequire } from "module";
const require = createRequire(import.meta.url);
function loadFeaturesSync() {
    try {
        // Preferred JSON data path
        const data = require("web-features/data/features.json");
        return (data?.default ?? data);
    }
    catch {
        try {
            const mod = require("web-features");
            return (mod.features ?? mod.default ?? []);
        }
        catch {
            // Fallback minimal set so the tool still works offline
            return [
                { id: "css-view-transitions", name: "View Transitions", status: { baseline: null } },
                { id: "html-popover-attribute", name: "Popover attribute", status: { baseline: null } },
                { id: "css-has-pseudo-class", name: ":has() pseudo-class", status: { baseline: null } },
            ];
        }
    }
}
// Cache features in-memory
let _featuresCache = null;
function getFeatures() {
    if (!_featuresCache)
        _featuresCache = loadFeaturesSync();
    return _featuresCache;
}
// Very lightweight evaluator: mark features with baseline flag as high,
// else unknown; extend later to consider engines/versions and Baseline year.
export function evaluateFeatureSupport(featureId) {
    const features = getFeatures();
    const f = features.find((x) => x.id === featureId);
    if (!f)
        return null;
    let support = "unknown";
    let message = "";
    if (f.status?.baseline) {
        support = "high";
        message = `Baseline: ${f.status.baseline}`;
    }
    else {
        support = "unknown";
        message = "No Baseline designation found";
    }
    return { featureId: f.id, name: f.name ?? f.id, baseline: support, message };
}
export function listFeatures() {
    const features = getFeatures();
    return features.map((f) => ({
        id: f.id,
        name: f.name ?? f.id,
        description: f.description,
        baseline: f.status?.baseline,
        status: f.status?.maturity ?? f.status?.baseline,
    }));
}
