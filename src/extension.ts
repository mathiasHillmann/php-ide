// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { registerDocumentProvider } from "./php-cs-fixer/php-cs-fixer";
import { phpDoc } from "./phpdoc/phpdoc";
import * as utils from "./utils";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  /*
   *  php-cs-fixer
   */
  const phpCsfixerCommand = vscode.commands.registerTextEditorCommand("php-ide.fix", function (textEditor) {
    vscode.commands.executeCommand("editor.action.formatDocument");
  });

  const phpCsfixerOnSave = vscode.workspace.onWillSaveTextDocument(function (event) {
    if (
      event.document.languageId === "php" &&
      utils.getConfig("fixOnSave") &&
      vscode.workspace.getConfiguration("editor", null).get("formatOnSave") === false
    ) {
      event.waitUntil(vscode.commands.executeCommand("editor.action.formatDocument"));
    }
  });

  const phpCsfixerFormatter = vscode.languages.registerDocumentFormattingEditProvider("php", {
    provideDocumentFormattingEdits: function (document: vscode.TextDocument) {
      return registerDocumentProvider(document);
    },
  });

  const phpDocCommand = vscode.commands.registerCommand("php-ide.addPhpDoc", function () {
    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === "php") {
      try {
        phpDoc(vscode.window.activeTextEditor);
      } catch (err) {
        if (err instanceof Error) {
          console.error(err);
          vscode.window.showErrorMessage(err.message);
        }
      }
    }
  });

  // Pushing extension stuff to vscode.
  context.subscriptions.push(phpCsfixerCommand, phpCsfixerOnSave, phpCsfixerFormatter, phpDocCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}
