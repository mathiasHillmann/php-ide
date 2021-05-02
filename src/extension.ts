// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { formatDocument } from "./php-cs-fixer/php-cs-fixer";
import { getConfig } from "./utils";

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
      console.error(err);
      vscode.window.showErrorMessage(err);
    }
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("php-ide.fix", function (textEditor) {
      vscode.commands.executeCommand("editor.action.formatDocument");
    })
  );

  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(function (event) {
      if (event.document.languageId === "php" && getConfig("fixOnSave") && vscode.workspace.getConfiguration("editor", null).get("formatOnSave") === false) {
        event.waitUntil(vscode.commands.executeCommand("editor.action.formatDocument"));
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("php", {
      provideDocumentFormattingEdits: function (document: vscode.TextDocument, options: vscode.FormattingOptions) {
        return registerDocumentProvider(document, options);
      },
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
