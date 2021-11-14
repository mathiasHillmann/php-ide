import { ExecException, execFile } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, isAbsolute, normalize, sep } from "path";
import { fileSync } from "tmp";
import { commands, languages, Range, TextDocument, TextEdit, workspace, Position, window } from "vscode";
import { getConfig, getExtensionPath, getPhpPath } from "../utils";

export class PhpCsFixer {
  public command = commands.registerTextEditorCommand("php-ide.fix", function (textEditor) {
    commands.executeCommand("editor.action.formatDocument");
  });

  public onSave = workspace.onWillSaveTextDocument((event): void => {
    if (
      event.document.languageId === "php" &&
      getConfig("php-cs-fixer.fixOnSave") &&
      workspace.getConfiguration("editor", null).get("formatOnSave") === false
    ) {
      event.waitUntil(commands.executeCommand("editor.action.formatDocument"));
    }
  });

  public formatter = languages.registerDocumentFormattingEditProvider("php", {
    provideDocumentFormattingEdits: (document: TextDocument) => this.registerDocumentProvider(document),
  });

  private registerDocumentProvider(document: TextDocument) {
    return new Promise<TextEdit[]>((resolve, reject): void => {
      try {
        this.formatDocument(document)
          .then(function (text: string) {
            const range = new Range(new Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
            resolve([new TextEdit(range, text)]);
          })
          .catch(function (err: Error) {
            window.showErrorMessage(err.message);
            reject();
          });
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          window.showErrorMessage(err.message);
        }
      }
    });
  }

  private formatDocument(document: TextDocument): Promise<string> {
    if (document.languageId !== "php") {
      throw new Error("This command requires that the document language is PHP.");
    }

    let toolPath: string = getConfig("php-cs-fixer.toolPath");
    let filename = document.fileName;
    let args: Array<string> = [];
    let opts = { cwd: dirname(filename) };

    if (toolPath === "") {
      toolPath = normalize(`${getExtensionPath()}/tools/php-cs-fixer`);
    }

    args.push(toolPath);
    args.push("fix");
    args.push("--using-cache=no");

    let config = getConfig("php-cs-fixer.config");
    if (config) {
      // Support config file with relative path
      if (!isAbsolute(config)) {
        let currentPath = opts.cwd;
        let triedPaths = [currentPath];
        while (!existsSync(currentPath + sep + config)) {
          let lastPath = currentPath;
          currentPath = dirname(currentPath);
          if (lastPath === currentPath) {
            throw new Error(`Unable to find ${config} file in ${triedPaths.join(", ")}`);
          } else {
            triedPaths.push(currentPath);
          }
        }
        config = currentPath + sep + config;
      }

      args.push("--config=" + config);
    } else {
      let rules = getConfig("php-cs.rules");
      if (rules) {
        args.push("--rules=" + rules);
      }
    }

    const tmpFile = fileSync();
    writeFileSync(tmpFile.name, document.getText());

    return new Promise<string>((resolve): void => {
      execFile(
        getPhpPath(),
        [...args, tmpFile.name],
        opts,
        function (err: ExecException | null, stdout: string, stderr: string) {
          if (err) {
            console.log([err, stdout, stderr]);
            tmpFile.removeCallback();
            throw new Error(`${err.message}: ${stderr}`);
          }
          const text = readFileSync(tmpFile.name, "utf-8");
          tmpFile.removeCallback();
          resolve(text);
        }
      );
    });
  }
}
