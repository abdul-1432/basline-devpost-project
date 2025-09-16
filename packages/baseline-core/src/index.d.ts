export type BaselineSupport = "high" | "medium" | "low" | "unknown";
export interface FeatureInfo {
    id: string;
    name: string;
    description?: string;
    baseline?: string;
    status?: string;
}
export interface EvaluationResult {
    featureId: string;
    name: string;
    baseline: BaselineSupport;
    message: string;
}
export declare function evaluateFeatureSupport(featureId: string): EvaluationResult | null;
export declare function listFeatures(): FeatureInfo[];
