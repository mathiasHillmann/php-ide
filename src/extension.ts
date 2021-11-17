import { ExtensionContext, CodeAction, workspace } from "vscode";
import { PhpDoc } from "./phpdoc/phpdoc";
import { PhpCsFixer } from "./php-cs-fixer/php-cs-fixer";
import { CodeHelper } from "./codehelper/codehelper";
import { setPhpPath, setPhpVersion } from "./utils";

declare global {
  var phpPath: string;
  var phpVersion: string;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {
  setPhpPath();
  setPhpVersion();
  const phpDoc = new PhpDoc();
  const phpCsFixer = new PhpCsFixer();
  const codeHelper = new CodeHelper();

  context.subscriptions.push(
    phpCsFixer.command,
    phpCsFixer.onSave,
    phpCsFixer.formatter,
    phpDoc.command,
    phpDoc.codeAction,
    codeHelper.codeAction
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
