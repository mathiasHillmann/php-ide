import * as utils from "../utils";
import * as vscode from "vscode";

export function phpDoc(editor: vscode.TextEditor) {
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
      let functionReturn: RegExpMatchArray | null = target.match(/\:\s+([\w_-]+)+/);
      let paramsFiltered = utils.splitLineComma(target.substring(target.indexOf("(") + 1, target.indexOf(")")));
      phpdoc += `\n/**`;
      phpdoc += `\n * ${utils.clearSpecialCharacters(functionName ? functionName[1] : "mixed")}`;
      phpdoc += `\n *`;
      paramsFiltered.forEach((element) => {
        phpdoc += `\n * @param ${utils.wordCount(element) > 1 ? element.trim() : "mixed " + element.trim()}`;
      });
      if (paramsFiltered.length !== 0) {
        phpdoc += `\n *`;
      }
      phpdoc += `\n * @return ${functionReturn ? functionReturn[1] : "void"}`;
      phpdoc += `\n */`;
      break;

    case /(const)+/g.test(target):
      /**
       * @var mixed ConstName
       */
      let constName: RegExpMatchArray | null = target.match(/([\w_-]+)\s+\=+/);
      phpdoc = `\n/**`;
      phpdoc += `\n * @var mixed ${constName ? constName[1] : "unnamed"}`;
      phpdoc += `\n */`;
      break;

    case /(public|private|protected|var)+/g.test(target):
      /**
       * @var type VarName
       */
      let varType: RegExpMatchArray | null = target.match(/([\w_-]+)\s+\$[\w_-]+/);
      let varName: RegExpMatchArray | null = target.match(/(\$[\w_-])+/);
      phpdoc = `\n/**`;
      phpdoc += `\n * @var ${!varType ? "mixed" : /(public|private|protected|var)+/g.test(varType[1]) ? "mixed" : varType[1]} ${
        varName ? varName[1] : "unnamed"
      }`;
      phpdoc += `\n */`;
      break;

    case /(class|enum|interface)+/g.test(target):
      /**
       * ClassName
       */
      let className: RegExpMatchArray | null = target.match(/(class|enum|interface)\s+([\w_-]+)+/);
      phpdoc = `\n/**`;
      phpdoc += `\n * ${utils.clearSpecialCharacters(className ? className[2] : "unnamed")}`;
      phpdoc += `\n */`;
      break;

    default:
      throw new Error("Could not match the selected text to any valid PSR5 definition. See more at https://www.php-fig.org/psr/ #5: PHPDoc Standard");
  }

  // Insert PHPDoc
  editor.edit(function (editBuilder) {
    // Get first lane of the selection
    let startLine = editor.selection.start.line;
    startLine--;
    // In case the first line is also the first line of the document
    if (startLine < 0) {
      startLine = 0;
      phpdoc += "\n";
    }

    //Set the position for inserting the PHPDoc
    let lineLength = editor.document.lineAt(startLine).text.length;
    let pos;
    if (lineLength > 0 && startLine !== 0) {
      pos = new vscode.Position(startLine, lineLength);
    } else {
      pos = new vscode.Position(startLine, 0);
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
