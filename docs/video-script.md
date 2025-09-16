# Baseline Guardian – Video Script

Goal
- Convince judges on innovation + usefulness by showing “My Baseline” across CLI, CI, editor, and dashboard.

Script (3–5 minutes)
1) Hook (10s)
- Problem: “Is it safe to use yet?” wastes dev time. We built Baseline Guardian: your linter, CLI, CI, and IDE know the answer.

2) What is Baseline? (10s)
- Baseline = common support across evergreen browsers; we extend it to “My Baseline” using your browserslist + usage.

3) CLI demo (60s)
- Show repo’s browserslist.
- Run scan with coverage:
  - node packages/baseline-cli/dist/index.js scan --path . --use-browserslist --report md --out baseline.md
- Open baseline.md: explain target list, feature rows, MDN/caniuse links, and coverage.
- Mention SARIF:
  - node packages/baseline-cli/dist/index.js scan --path . --use-browserslist --report sarif --out baseline.sarif
  - Uploaded in CI for code scanning.

4) ESLint/Stylelint (40s)
- Show ESLint rule flagging document.startViewTransition/popover.
- Show Stylelint rule flagging :has().
- Explain progressive enhancement suggestions (roadmap).

5) API + Dashboard (60s)
- Show API health, /targets, and /features/:id?useTargets=true.
- Open http://localhost:5173. Use FeatureCheck to evaluate a feature vs targets.

6) CI (40s)
- Open GitHub Actions workflows: baseline-scan.yml and pr-comment.yml.
- Explain SARIF -> Code Scanning alerts and sticky PR comments.

7) IDE (30s)
- Open VS Code extension command “Baseline: Check Feature”.
- Show Baseline, targets, coverage, MDN/caniuse links.

8) Close (20s)
- Why it wins: integrates Baseline everywhere, unlocks confident adoption of modern features.
- Roadmap: deeper AST mapping, auto-fixes, IDE hovers/diagnostics, analytics.
