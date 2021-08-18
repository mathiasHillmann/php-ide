import * as vscode from "vscode";

function getImports(document: vscode.TextDocument) {
  let lines: Array<string> = [];
  for (let i = 0; i < 99; i++) {
    lines.push(editor.document.lineAt(editor.selection.start.line + i).text);
    if (lines.some((e) => e.includes(";")) || lines.some((e) => e.includes("{"))) {
      break;
    }
  }
}

export function orderImports(document: vscode.TextDocument) {

}
