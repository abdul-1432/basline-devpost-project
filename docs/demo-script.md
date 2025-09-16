# Baseline Guardian – Devops & Submission Checklist

1) Install toolchain
- Node 20+ (ok)
- Docker Desktop (optional, recommended)
- pnpm (optional): npm i -g pnpm

2) Install dependencies
- npm install
- Build packages: npm run build

3) Local run
- API: npm run dev:api
- Web: npm run dev:web

4) CLI smoke test
- npx tsx packages/baseline-cli/src/index.ts features --json | Out-File -FilePath features.json
- npx tsx packages/baseline-cli/src/index.ts scan --path . --report sarif --out baseline.sarif

5) ESLint plugin try-out
- In a sample app, add to ESLint config:
  {
    "plugins": ["@baseline-guardian/baseline"],
    "rules": { "@baseline-guardian/baseline/no-nonbaseline-apis": "warn" }
  }

6) CI integration
- GitHub Actions: run CLI → upload SARIF (code scanning) via .github/workflows/baseline-scan.yml
- PR comment: sticky comment with Markdown summary via .github/workflows/pr-comment.yml

7) Demo video script
- Problem → Baseline intro → CLI scan on a repo → SARIF in GitHub → ESLint catching code → Dashboard viewing features & trend.

8) Future work
- Rich mapping from AST to features (babel parser)
- Project targeting (browserslist) to compute “Baseline for my audience”
- IDE extension (VS Code) consuming core lib
- Link to MDN + caniuse for each feature
