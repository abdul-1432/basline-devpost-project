import { evaluateFeatureSupport } from '@baseline-guardian/baseline-core';

// Minimal Stylelint rule API-like surface for demonstration (not full types)
export default function plugin(primaryOption: boolean) {
  return (root: any, result: any) => {
    root.walkDecls((decl: any) => {
      // Flag :has(
      if (decl.value && /:has\(/.test(decl.value)) {
        const res = evaluateFeatureSupport('css-has-pseudo-class');
        result.warn(`Potential non-baseline feature :has() -> ${res?.message ?? ''}`, { node: decl });
      }
    });

    root.walkRules((rule: any) => {
      if (rule.selector && /:has\(/.test(rule.selector)) {
        const res = evaluateFeatureSupport('css-has-pseudo-class');
        result.warn(`Potential non-baseline feature :has() -> ${res?.message ?? ''}`, { node: rule });
      }
    });
  };
}