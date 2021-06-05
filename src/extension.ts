// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { formatDocument } from "./php-cs-fixer/php-cs-fixer";
import { phpDoc } from "./phpdoc/phpdoc";
import * as utils from "./utils";

function registerDocumentProvider(document: vscode.TextDocument, options: vscode.FormattingOptions) {
  return new Promise<vscode.TextEdit[]>(function (resolve, reject) {
    try {
      formatDocument(document)
        .then(function (text: string) {
          const range = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
          resolve([new vscode.TextEdit(range, text)]);
        })
        .catch(function (err: Error) {
          vscode.window.showErrorMessage(err.message);
          reject();
        });
    } catch (err) {
      console.log(err);
      vscode.window.showErrorMessage(err.message);
    }
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  /*
   *  php-cs-fixer
   */
  const fixCommand = vscode.commands.registerTextEditorCommand("php-ide.fix", function (textEditor) {
    vscode.commands.executeCommand("editor.action.formatDocument");
  });

  const fixOnSave = vscode.workspace.onWillSaveTextDocument(function (event) {
    if (
      event.document.languageId === "php" &&
      utils.getConfig("php-cs-fixer.fixOnSave") &&
      vscode.workspace.getConfiguration("editor", null).get("formatOnSave") === false
    ) {
      event.waitUntil(vscode.commands.executeCommand("editor.action.formatDocument"));
    }
  });

  const fixFormatter = vscode.languages.registerDocumentFormattingEditProvider("php", {
    provideDocumentFormattingEdits: function (document: vscode.TextDocument, options: vscode.FormattingOptions) {
      return registerDocumentProvider(document, options);
    },
  });

  /*
   * PHPDoc
   */
  const phpDocCommand = vscode.commands.registerCommand("php-ide.addPhpDoc", function () {
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === "php") {
      try {
        phpDoc(vscode.window.activeTextEditor);
      } catch (err) {
        console.log(err);
        vscode.window.showErrorMessage(err.message);
      }
    }
  });

  // Pushing extension stuff to vscode.
  context.subscriptions.push(fixCommand, fixOnSave, fixFormatter, phpDocCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
