import type { Rule } from "eslint";
import { evaluateFeatureSupport } from "@baseline-guardian/baseline-core";

// Simple heuristic: flag usage of document.startViewTransition and others.
const ruleNoNonBaselineApis: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow web APIs that are not in Baseline (prototype)",
      recommended: false
    },
    schema: [],
    messages: {
      nonbaseline: "{{api}} may not be in Baseline: {{message}}"
    }
  },
  create(context: any) {
    return {
      MemberExpression(node: any) {
        try {
          const obj = context.getSourceCode().getText(node.object);
          const prop = context.getSourceCode().getText(node.property);
          const expr = `${obj}.${prop}`;
          if (expr === "document.startViewTransition") {
            const res = evaluateFeatureSupport("css-view-transitions");
            context.report({ node, messageId: "nonbaseline", data: { api: expr, message: res?.message ?? "Unknown" } });
          }
        } catch {}
      },
      JSXAttribute(node: any) {
        try {
          if (node.name?.name === "popover") {
            const res = evaluateFeatureSupport("html-popover-attribute");
            context.report({ node, messageId: "nonbaseline", data: { api: "popover", message: res?.message ?? "Unknown" } });
          }
        } catch {}
      }
    };
  }
};

export const rules: Record<string, Rule.RuleModule> = {
  "no-nonbaseline-apis": ruleNoNonBaselineApis
};

export default { rules };
