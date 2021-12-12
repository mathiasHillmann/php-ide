import { Constant, Method, Property } from "php-parser";
import {
  CodeAction,
  CodeActionKind,
  CodeActionProvider,
  commands,
  languages,
  Position,
  Range,
  TextDocument,
  TextEditor,
  window,
} from "vscode";
import { clearSpecialCharacters, wordCount, treeWalk, parseDocument, getIdentifierName } from "../utils";

export class PhpDoc implements CodeActionProvider {
  public provideCodeActions(document: TextDocument, range: Range): CodeAction[] | undefined {
    const entireLine = document.lineAt(range.start).text;
    switch (true) {
      case /(function)+/g.test(entireLine):
      case /(const)+/g.test(entireLine):
      case /(public|private|protected|var)+/g.test(entireLine):
      case /(class|enum|interface)+/g.test(entireLine):
        break;

      default:
        return;
    }

    const previousLine = document.lineAt(range.start.line - 1);
    if (previousLine.text.includes("*/")) {
      return;
    }

    const fix = new CodeAction("Add PHPDoc", CodeActionKind.QuickFix);
    fix.command = { command: "php-ide.addPhpDoc", title: "Add PHPDoc" };
    fix.isPreferred = true;
    return [fix];
  }

  public codeAction = languages.registerCodeActionsProvider("php", this);

  public command = commands.registerCommand("php-ide.addPhpDoc", () => {
    if (window.activeTextEditor && window.activeTextEditor.document.languageId === "php") {
      try {
        this.phpDoc(window.activeTextEditor);
      } catch (err) {
        if (err instanceof Error) {
          console.log(err);
          window.showErrorMessage(err.message);
        }
      }
    }
  });

  private phpDoc(editor: TextEditor) {
    // Get all text until ';' or '{', even if in another line
    let lines: Array<string> = [];
    for (let i = 0; i < 99; i++) {
      lines.push(editor.document.lineAt(editor.selection.start.line + i).text);
      if (lines.some((e) => e.includes(";")) || lines.some((e) => e.includes("{"))) {
        break;
      }
    }
    const target: string = lines.join("").replace(/\s\s+/g, " ");
    let phpdoc: string = "";

    const tree = parseDocument(editor.document);

    if (tree) {
      // Prepare PHPDoc
      switch (true) {
        case /(function)+/g.test(target):
          /**
           *  FunctionName
           *
           *  @param type ParamName
           *  @param type ParamName
           *
           *  @return String
           */

          let functionName: RegExpMatchArray | null = target.match(/function\s+([\w_-]+)+/);
          let functionNode = treeWalk(tree.children, functionName![1]) as Method;

          phpdoc += `\n/**`;
          phpdoc += `\n * ${getIdentifierName(functionNode.name)}`;
          phpdoc += `\n *`;
          if (functionNode.arguments.length > 0) {
            functionNode.arguments.forEach((arg) => {
              phpdoc += `\n * @param ${arg.type ? arg.type.name : "mixed"} ${getIdentifierName(arg.name)}`;
            });
            phpdoc += `\n *`;
          }
          phpdoc += `\n * @return ${functionNode.type ? functionNode.type.name : "void"}`;

          phpdoc += `\n */`;
          break;

        case /(const)+/g.test(target):
          /**
           * @var ConstName
           */
          let constName: RegExpMatchArray | null = target.match(/([\w_-]+)\s+\=+/);
          let constant = treeWalk(tree.children, constName![1]) as Constant;

          phpdoc = `\n/**`;
          phpdoc += `\n * @var ${getIdentifierName(constant.name)}`;
          phpdoc += `\n */`;
          break;

        case /(public|private|protected|var)+/g.test(target):
          /**
           * @var type VarName
           */
          let varName: RegExpMatchArray | null = target.match(/(\$[\w_-]+)+/);
          let property = treeWalk(tree.children, clearSpecialCharacters(varName![1])) as Property;

          phpdoc = `\n/**`;
          phpdoc += `\n * @var `;
          if (property.type && !Array.isArray(property.type)) {
            phpdoc += `${property.type?.name}`;
          } else {
            phpdoc += `mixed`;
          }

          phpdoc += ` ${getIdentifierName(property.name)}`;

          phpdoc += `\n */`;
          break;

          break;

        case /(class|enum|interface)+/g.test(target):
          /**
           * ClassName
           */
          let className: RegExpMatchArray | null = target.match(/(class|enum|interface)\s+([\w_-]+)+/);
          phpdoc = `\n/**`;
          phpdoc += `\n * ${clearSpecialCharacters(className ? className[2] : "unnamed")}`;
          phpdoc += `\n */`;
          break;

        default:
          throw new Error(
            "Could not match the selected text to any valid PSR5 definition. See more at https://www.php-fig.org/psr/ #5: PHPDoc Standard"
          );
      }

      // Insert PHPDoc
      editor.edit(function (editBuilder) {
        // Get first lane of the selection
        let startLine = editor.selection.start.line;
        startLine--;
        // In case the first line is also the first line of the document
        if (startLine < 0) {
          startLine = 0;
          phpdoc += `\n`;
        }

        //Set the position for inserting the PHPDoc
        let lineLength = editor.document.lineAt(startLine).text.length;
        let pos;
        if (lineLength > 0 && startLine !== 0) {
          pos = new Position(startLine, lineLength);
        } else {
          pos = new Position(startLine, 0);
        }

        // Indent the PHPDoc to match the text used to create the PHPDoc
        let stringToIndent = "";
        var line = editor.document.lineAt(editor.selection.start.line).text;
        var offset = editor.document.lineAt(editor.selection.start.line).firstNonWhitespaceCharacterIndex;
        for (var i = 0; i < offset; i++) {
          if (line.charAt(i) === "\t") {
            stringToIndent = stringToIndent + "\t";
          } else if (line.charAt(i) === " ") {
            stringToIndent = stringToIndent + " ";
          }
        }
        phpdoc = phpdoc.replace(/^/gm, stringToIndent);

        // Finally insert the PHPDoc
        editBuilder.insert(pos, phpdoc);
      });
    }
  }

  private filterParams(target: string): Array<string> {
    const paramString = target.substring(target.indexOf("(") + 1, target.indexOf(")"));
    const paramArray = paramString.split(",").filter((a) => a !== "");
    let returnArray: Array<string> = [];

    paramArray.forEach((param) => {
      if (param.indexOf("=") !== -1) {
        param = param.split("=")[0];
      }
      if (wordCount(param)) {
        param = param.trim();
      } else {
        param = `mixed ${param.trim()}`;
      }
      returnArray.push(param);
    });

    return returnArray;
  }
}
