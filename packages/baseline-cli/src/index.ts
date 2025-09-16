#!/usr/bin/env node
import { Command } from "commander";
import { evaluateFeatureSupport, listFeatures } from "@baseline-guardian/baseline-core";
import fg from "fast-glob";
import fs from "fs";

const program = new Command();
program
  .name("baseline-guardian")
  .description("Baseline-aware CLI to evaluate web features and scan projects")
  .version("0.1.0");

program
  .command("features")
  .description("List known web features from Baseline dataset")
  .option("--json", "Output JSON")
  .action((opts) => {
    const items = listFeatures();
    if (opts.json) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      for (const f of items.slice(0, 50)) {
        console.log(`${f.id} - ${f.name} ${f.baseline ? `(Baseline: ${f.baseline})` : ""}`);
      }
      if (items.length > 50) console.log(`... and ${items.length - 50} more`);
    }
  });

program
  .command("check")
  .description("Check a feature id for Baseline support")
  .argument("<featureId>")
  .action((featureId) => {
    const res = evaluateFeatureSupport(featureId);
    if (!res) {
      console.error("Feature not found");
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(res, null, 2));
  });

program
  .command("scan")
  .description("Scan source files for known risky API patterns (prototype – JS DOM calls)")
  .option("--path <path>", "Path to scan", ".")
  .option("--report <fmt>", "Report format: text|sarif|md", "text")
  .option("--out <file>", "Output file (for sarif or md)")
  .option("--use-browserslist", "Evaluate against project browserslist targets")
  .option("--fail-on <level>", "fail if any finding at level: note|warning|error", "warning")
  .action(async (opts) => {
    const files = await fg(["**/*.{js,jsx,ts,tsx}"], { cwd: opts.path, ignore: ["**/node_modules/**", "**/dist/**"] });
    const findings: any[] = [];
    const targets = opts.useBrowserslist ? (await import("@baseline-guardian/baseline-core")).getProjectTargets(process.cwd()) : [];
    const riskyApis = [
      { id: "css-view-transitions", pattern: /document\.startViewTransition/ },
      { id: "html-popover-attribute", pattern: /popover=/ },
      { id: "css-has-pseudo-class", pattern: /:has\(/ },
    ];
    for (const file of files) {
      const full = `${opts.path}/${file}`.replace(/\\/g, "/");
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const r of riskyApis) {
          if (r.pattern.test(line)) {
            const evalRes = opts.useBrowserslist
              ? (await import("@baseline-guardian/baseline-core")).evaluateForTargets(r.id, targets)
              : evaluateFeatureSupport(r.id);
            findings.push({ file: full, line: i + 1, featureId: r.id, evaluation: evalRes, targets });
          }
        }
      }
    }

    if (opts.report === "sarif") {
      const sarif = {
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        version: "2.1.0",
        runs: [
          {
            tool: {
              driver: {
                name: "baseline-guardian",
                version: "0.1.0",
                rules: Array.from(new Set(findings.map(f => f.featureId))).map((fid) => ({
                  id: fid,
                  name: fid,
                  shortDescription: { text: `Baseline check for ${fid}` }
                }))
              }
            },
            results: findings.map((f) => ({
              ruleId: f.featureId,
              message: { text: f.evaluation?.message ?? "Unknown" },
              locations: [{
                physicalLocation: {
                  artifactLocation: { uri: f.file },
                  region: { startLine: f.line }
                }
              }],
              level: (f.evaluation?.baseline === "high") ? "note" : "warning"
            }))
          }
        ]
      };
      if (opts.out) {
        fs.writeFileSync(opts.out, JSON.stringify(sarif, null, 2));
      } else {
        console.log(JSON.stringify(sarif, null, 2));
      }
    } else if (opts.report === "md") {
      const lines = [
        `# Baseline Guardian Report`,
        ``,
        targets.length ? `Targets: ${targets.join(", ")}` : ``,
        ``,
        `| File | Line | Feature | Baseline | Message |`,
        `|------|------|---------|----------|---------|`
      ].filter(Boolean);
      if (targets.length) {
        lines.push(`Coverage: ${findings.map(f => f.evaluation?.coverage ?? "-").filter(Boolean)[0] ?? "-"}%`);
        lines.push("");
      }
      for (const f of findings) {
        const links = (await import("@baseline-guardian/baseline-core")).getFeatureLinks(f.featureId);
        const linkStr = links ? `[MDN](${links.mdn ?? ''}) ${links.caniuse ? `[caniuse](${links.caniuse})` : ''}` : '';
        lines.push(`| ${f.file} | ${f.line} | ${f.featureId} | ${f.evaluation?.baseline ?? "unknown"} | ${(f.evaluation?.message ?? "").replace(/\|/g,'\\|')} ${linkStr} |`);
      }
      const out = lines.join("\n");
      if (opts.out) fs.writeFileSync(opts.out, out);
      else console.log(out);
    } else {
      if (findings.length === 0) {
        console.log("No findings");
      } else {
        for (const f of findings) {
          const cov = f.evaluation?.coverage != null ? ` (${f.evaluation.coverage}%)` : "";
          const links = (await import("@baseline-guardian/baseline-core")).getFeatureLinks(f.featureId);
          const linkStr = links ? ` [MDN](${links.mdn ?? ''})${links.caniuse ? ` [caniuse](${links.caniuse})` : ''}` : '';
          console.log(`${f.file}:${f.line} ${f.featureId} -> ${f.evaluation?.baseline ?? "unknown"}${cov}${linkStr}`);
        }
      }
    }

    const hasWarning = findings.some((f) => (f.evaluation?.baseline ?? "unknown") !== "high");
    if (opts.fail_on && (opts.fail_on === 'warning' || opts.fail_on === 'error')) {
      if (opts.fail_on === 'warning' && hasWarning) process.exitCode = 2;
      if (opts.fail_on === 'error' && hasWarning) process.exitCode = 1;
    }
  });

program.parse();
