import * as vscode from "vscode";
import * as path from "path";

export function getConfig(key: string): string {
  return vscode.workspace.getConfiguration("php-ide").get(key) || "";
}

export function getExtensionPath(): string {
  return vscode.extensions.getExtension("mhillmann.php-ide")?.extensionPath ?? path.join(__dirname, "..");
}
