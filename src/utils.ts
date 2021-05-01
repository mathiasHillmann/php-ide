import * as vscode from "vscode";

export function getConfig(key: string): string {
  return vscode.workspace.getConfiguration("php-ide").get(key) || "";
}
