import { exec, ExecException } from "child_process";
import { join } from "path";
import { Engine, Node, Program, Identifier } from "php-parser";
import { lt } from "semver";
import { TextDocument, workspace, Range, window, commands } from "vscode";

export function getConfig(key: string): string {
  // @ts-ignore
  return workspace.getConfiguration("php-ide").get(key);
}

export function getExtensionPath(): string {
  return join(__dirname, "..");
}

export function wordCount(line: string): number {
  return line.split(" ").filter((a) => a !== "").length;
}

export function clearSpecialCharacters(s: string): string {
  return s.replace(/[\W_]+/g, "");
}

export function uppercaseFirstCharacter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getLine(document: TextDocument, range: Range, offset: number = 0): string {
  if (range.start.line !== 0) {
    return document.lineAt(range.start.line + offset).text;
  } else {
    return document.lineAt(range.start.line).text;
  }
}

export function setPhpPath(): void {
  const conf = workspace.getConfiguration("php");
  global.phpPath =
    conf.get<string>("executablePath") ||
    conf.get<string>("validate.executablePath") ||
    (process.platform === "win32" ? "php.exe" : "php");
}

export function setPhpVersion(): void {
  exec(`${global.phpPath} --version`, function (err: ExecException | null, stdout: string, stderr: string) {
    if (err) {
      console.log([err, stdout, stderr]);
      window
        .showErrorMessage(
          "PHP executable not found. Install PHP 5.6 or higher and add it to your PATH or set the php.executablePath setting",
          "Open settings"
        )
        .then(function (val) {
          if (val === "Open settings") {
            commands.executeCommand("workbench.action.openGlobalSettings");
          }
        });
    }
    // Parse version and discard OS info like 7.0.8--0ubuntu0.16.04.2
    const match = stdout.match(/^PHP ([^\s]+)/m);
    if (!match) {
      window.showErrorMessage("Error parsing PHP version. Please check the output of php --version");
      return;
    }
    let version = match[1].split("-")[0];
    // Convert PHP prerelease format like 7.0.0rc1 to 7.0.0-rc1
    if (!/^\d+.\d+.\d+$/.test(version)) {
      version = version.replace(/(\d+.\d+.\d+)/, "$1-");
    }
    if (lt(version, "5.6.0")) {
      window.showErrorMessage("The language server needs at least PHP 5.6 installed. Version found: " + version);
      return;
    }
    global.phpVersion = version;
  });
}

export function treeWalk(nodes: any[], needle: string): Node | undefined {
  let nodeFound: Node | undefined;

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (node.name && getIdentifierName(node.name) === needle) {
        return node;
      } else {
        for (const key in node) {
          if (Array.isArray(node[key]) && node[key].length > 0) {
            nodeFound = treeWalk(node[key], needle);
          }

          if (nodeFound) {
            break;
          }
        }
      }

      if (nodeFound) {
        break;
      }
    }
  }

  return nodeFound;
}

export function parseDocument(document: TextDocument): Program | undefined {
  const parser = new Engine({
    parser: {
      extractDoc: true,
    },
    ast: {
      withPositions: true,
    },
  });

  try {
    return parser.parseCode(document.getText(), "foo.php");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to parse php code: ${error.message}`);
    }
  }
}

export function getIdentifierName(identifier: string | Identifier): string {
  if (typeof identifier === "string") {
    return identifier;
  } else {
    return identifier.name;
  }
}
