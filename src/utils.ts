import { join } from "path";
import { workspace } from "vscode";

export function getConfig(key: string): string {
  // @ts-ignore
  return workspace.getConfiguration("php-ide").get(key);
}

export function getPhpPath(): string {
  const phpKey = workspace.getConfiguration("php.validate");
  if (phpKey) {
    const path = phpKey.get("executablePath");
    if (path && typeof path === "string") {
      return path;
    }
  }

  throw new Error(
    'This extension requires PHP. Please set the setting "php.validate.executablePath" in your settings.json'
  );
}

export function getExtensionPath(): string {
  return join(__dirname, "..");
}

export function wordCount(line: string): Number {
  return line.split(" ").filter((a) => a !== "").length;
}

export function clearSpecialCharacters(s: string): String {
  return s.replace(/[\W_]+/g, "");
}

export function uppercaseFirstCharacter(s: string): String {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
