import * as vscode from 'vscode';
import { evaluateFeatureSupport, getProjectTargets, evaluateForTargets, getFeatureLinks } from '@baseline-guardian/baseline-core';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('baselineGuardian.checkFeature', async () => {
    const featureId = await vscode.window.showInputBox({ prompt: 'Enter Baseline feature id', value: 'css-has-pseudo-class' });
    if (!featureId) return;
    const targets = getProjectTargets(vscode.workspace.rootPath || process.cwd());
    const res = evaluateForTargets(featureId, targets) || evaluateFeatureSupport(featureId);
    if (!res) {
      vscode.window.showErrorMessage('Feature not found');
      return;
    }
    const links = getFeatureLinks(featureId);
    const coverage = (res as any).coverage != null ? ` coverage ${(res as any).coverage}%` : '';
    const md = new vscode.MarkdownString(`# ${res.name}\n\n- Baseline: **${res.baseline}**${coverage}\n- Targets: ${targets.join(', ') || '(none)'}\n- ${res.message}\n${links?.mdn ? `- [MDN](${links.mdn})\n` : ''}${links?.caniuse ? `- [caniuse](${links.caniuse})\n` : ''}`);
    md.isTrusted = true;
    vscode.window.showInformationMessage(res.name);
    vscode.window.showInformationMessage(res.message);
    vscode.window.showInformationMessage(`Baseline: ${res.baseline}${coverage}`);
    vscode.window.showInformationMessage(`Targets: ${targets.join(', ') || '(none)'}`);
    vscode.commands.executeCommand('markdown.showPreview', md);
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}