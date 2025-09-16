# Baseline Guardian

Accelerate safe adoption of modern web features with Baseline data integrated across your tooling: CLI + ESLint rule + CI reporting + Dashboard.

Highlights
- Baseline-aware CLI: check features, scan code, emit SARIF for CI, Markdown PR report, and “My Baseline” using browserslist.
- ESLint rule: flag non-Baseline APIs with autofixable alternatives where possible.
- Stylelint plugin: flag CSS :has(), view transitions, etc.
- API + Dashboard (MERN + TypeScript): endpoints for features, targets, and evaluations.
- GitHub Actions: SARIF upload to Code Scanning + sticky PR comment.
- Docker Compose for one-command bring-up in prod; local dev can run without Docker.

Quick start
1) Install dependencies
- Requires Node 20+ (detected), npm 9+ (detected). Docker optional.
- Recommended: Docker Desktop (for MongoDB) and pnpm (optional). On Windows, install Docker Desktop from https://www.docker.com/products/docker-desktop.

2) Install packages
- From repo root:
  - npm install

3) Dev mode (without Docker)
- Terminal 1: npm run dev:api
- Terminal 2: npm run dev:web
- Optional: run CLI scan
  - npx baseline-guardian scan --path . --report sarif --out baseline.sarif

4) With Docker (optional)
- docker compose up -d

My Baseline targeting
- Put a browserslist in your project (package.json browserslist or .browserslistrc). CLI/API can evaluate against these targets with --use-browserslist.

Monorepo structure
- packages/
  - baseline-core: Baseline dataset access + evaluation (+ My Baseline via browserslist)
  - baseline-cli: Command-line interface (SARIF, Markdown, fail-on)
  - eslint-plugin-baseline: ESLint rule no-nonbaseline-apis
  - stylelint-plugin-baseline: Stylelint plugin to flag CSS non-baseline features
- apps/
  - api: Express API (TypeScript) with JWT and optional MongoDB
  - web: React + Vite dashboard (TypeScript)

License
MIT

Deployment
- GitHub Pages: the web app auto-deploys via .github/workflows/gh-pages.yml on pushes to main. Published under your account’s Pages site.
