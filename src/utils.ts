import * as vscode from "vscode";
import * as path from "path";

export function getConfig(key: string): string {
  // @ts-ignore
  return vscode.workspace.getConfiguration("php-ide").get(key);
}

export function getExtensionPath(): string {
  return path.join(__dirname, "..");
}

export function wordCount(line: string): Number {
  return line.split(" ").filter((a) => a !== "").length;
}

export function splitLineComma(line: string): Array<string> {
  return line.split(",").filter((a) => a !== "");
}

export function clearSpecialCharacters(s: string): String {
  return s.replace(/[\W_]+/g, "");
}

export function uppercaseFirstCharacter(s: string): String {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
