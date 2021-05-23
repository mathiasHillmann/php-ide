import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as tmp from "tmp";
import * as cp from "child_process";
import { ExecException } from "node:child_process";
import * as utils from "../utils";

export function formatDocument(document: vscode.TextDocument): Promise<string> {
  if (document.languageId !== "php") {
    throw new Error("This command requires that the language is PHP.");
  }

  let toolPath: string = utils.getConfig("php-cs-fixer.toolPath");
  let filename = document.fileName;
  let args: Array<string> = [];
  let opts = { cwd: path.dirname(filename) };

  if (toolPath === "") {
    toolPath = path.normalize(`${utils.getExtensionPath()}/tools/php-cs-fixer`);
  }

  args.push(toolPath);
  args.push("fix");
  args.push("--using-cache=no");

  let config = utils.getConfig("php-cs-fixer.config");
  if (config) {
    // Support config file with relative path
    if (!path.isAbsolute(config)) {
      let currentPath = opts.cwd;
      let triedPaths = [currentPath];
      while (!fs.existsSync(currentPath + path.sep + config)) {
        let lastPath = currentPath;
        currentPath = path.dirname(currentPath);
        if (lastPath === currentPath) {
          throw new Error(`Unable to find ${config} file in ${triedPaths.join(", ")}`);
        } else {
          triedPaths.push(currentPath);
        }
      }
      config = currentPath + path.sep + config;
    }

    args.push("--config=" + config);
  } else {
    let rules = utils.getConfig("php-cs.rules");
    if (rules) {
      args.push("--rules=" + rules);
    }
  }

  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, document.getText());

  return new Promise<string>(function (resolve) {
    cp.execFile("php", [...args, tmpFile.name], opts, function (err: ExecException | null, stdout: string, stderr: string) {
      if (err) {
        console.log([err, stdout, stderr]);
        tmpFile.removeCallback();
        throw new Error(`${err.message}: ${stderr}`);
      }
      const text = fs.readFileSync(tmpFile.name, "utf-8");
      tmpFile.removeCallback();
      resolve(text);
    });
  });
}
