import { ExtensionContext, CodeAction } from "vscode";
import { PhpDoc } from "./phpdoc/phpdoc";
import { PhpCsFixer } from "./php-cs-fixer/php-cs-fixer";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {
  const phpDoc = new PhpDoc();
  const phpCsFixer = new PhpCsFixer();

  context.subscriptions.push(
    phpCsFixer.command,
    phpCsFixer.onSave,
    phpCsFixer.formatter,
    phpDoc.command,
    phpDoc.codeAction
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
