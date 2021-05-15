import * as vscode from "vscode";
import * as path from "path";

export function getConfig(key: string): string {
  // @ts-ignore
  return vscode.workspace.getConfiguration("php-ide").get(key);
}

export function getExtensionPath(): string {
  return path.join(__dirname, "..");
}
