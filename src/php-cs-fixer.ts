import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as tmp from "tmp";
import * as cp from "child_process";
import { ExecException } from "node:child_process";
import { getConfig } from "./utils";

export function formatDocument(document: vscode.TextDocument) {
  return new Promise<string>(function (resolve, reject) {
    if (document.languageId !== "php") {
      reject(new Error("This command requires that the language is PHP."));
    }

    let toolPath: string = getConfig("toolPath");
    let filename = document.fileName;
    let args: Array<string> = [];
    let opts = { cwd: path.dirname(filename) };

    if (toolPath === "") {
      let extensionPath = vscode.extensions.getExtension("hillmann.php-ide") ?? __dirname;
      toolPath = path.normalize(`${extensionPath}/vendor/bin/php-cs-fixer`);
    }

    args.push(toolPath);
    args.push("fix");

    if (!getConfig("useCache")) {
      args.push("--using-cache=no");
    }

    if (getConfig("allowRisky")) {
      args.push("--allow-risky=yes");
    }

    let config = getConfig("config");
    if (config) {
      // Support config file with relative path
      if (!path.isAbsolute(config)) {
        let currentPath = opts.cwd;
        let triedPaths = [currentPath];
        while (!fs.existsSync(currentPath + path.sep + config)) {
          let lastPath = currentPath;
          currentPath = path.dirname(currentPath);
          if (lastPath === currentPath) {
            reject(new Error(`Unable to find ${config} file in ${triedPaths.join(", ")}`));
          } else {
            triedPaths.push(currentPath);
          }
        }
        config = currentPath + path.sep + config;
      }

      args.push("--config=" + config);
    } else {
      let rules = getConfig("rules");
      if (rules) {
        args.push("--rules=" + rules);
      }
    }

    const tmpFile = tmp.fileSync();
    fs.writeFileSync(tmpFile.name, document.getText());

    cp.execFile("php", [...args, tmpFile.name], opts, function (err: ExecException | null) {
      if (err) {
        tmpFile.removeCallback();
        reject(new Error("There was an error while running php-cs-fixer. Check the Developer Tools console for more information."));
      }
      const text = fs.readFileSync(tmpFile.name, "utf-8");
      tmpFile.removeCallback();
      resolve(text);
    });
  });
}
