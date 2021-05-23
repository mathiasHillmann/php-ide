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
    // final|abstract static function getA (int $a): number
    case /(final|abstract)\s+(function)\s+([\w_-]+)+/g.test(target):
      /**
       *  FunctionName
       *
       *  @param type ParamName
       *  @param type ParamName
       *
       *  @return String
       */
      let typedStaticFunctionFiltered = utils.splitLine(target);
      let typedStaticParamsFiltered = utils.splitLineComma(target.substring(target.indexOf("(") + 1, target.indexOf(")")));
      phpdoc += `\n/**`;
      phpdoc += `\n * Static ${utils.clearSpecialCharacters(typedStaticFunctionFiltered[4].substring(0, typedStaticFunctionFiltered[4].indexOf("(")))}`;
      phpdoc += `\n *`;
      typedStaticParamsFiltered.forEach((element) => {
        phpdoc += `\n * @param ${utils.wordCount(element) > 1 ? element.trim() : " mixed " + element.trim()}`;
      });
      if (typedStaticParamsFiltered.length !== 0) {
        phpdoc += `\n *`;
      }
      phpdoc += `\n * @return ${/(\:)\s+([\w_-]+)+/g.exec(target)![2] ?? "mixed"}`;
      phpdoc += `\n */`;
      break;

    // final|abstract function getA (int $a): number
    case /(final|abstract)\s+(function)\s+([\w_-]+)+/g.test(target):
      /**
       *  FunctionName
       *
       *  @param type ParamName
       *  @param type ParamName
       *
       *  @return String
       */
      let typedFunctionFiltered = utils.splitLine(target);
      let typedParamsFiltered = utils.splitLineComma(target.substring(target.indexOf("(") + 1, target.indexOf(")")));
      phpdoc += `\n/**`;
      phpdoc += `\n * Static ${utils.clearSpecialCharacters(typedFunctionFiltered[3].substring(0, typedFunctionFiltered[3].indexOf("(")))}`;
      phpdoc += `\n *`;
      typedParamsFiltered.forEach((element) => {
        phpdoc += `\n * @param ${utils.wordCount(element) > 1 ? element.trim() : " mixed " + element.trim()}`;
      });
      if (typedParamsFiltered.length !== 0) {
        phpdoc += `\n *`;
      }
      phpdoc += `\n * @return ${/(\:)\s+([\w_-]+)+/g.exec(target)![2] ?? "mixed"}`;
      phpdoc += `\n */`;
      break;

    // static function getA (int $a): number
    case /(static)\s+(function)\s+([\w_-]+)+/g.test(target):
      /**
       *  FunctionName
       *
       *  @param type ParamName
       *  @param type ParamName
       *
       *  @return String
       */
      let staticFunctionFiltered = utils.splitLine(target);
      let staticParamsFiltered = utils.splitLineComma(target.substring(target.indexOf("(") + 1, target.indexOf(")")));
      phpdoc += `\n/**`;
      phpdoc += `\n * Static ${utils.clearSpecialCharacters(staticFunctionFiltered[3].substring(0, staticFunctionFiltered[3].indexOf("(")))}`;
      phpdoc += `\n *`;
      staticParamsFiltered.forEach((element) => {
        phpdoc += `\n * @param ${utils.wordCount(element) > 1 ? element.trim() : " mixed " + element.trim()}`;
      });
      if (staticParamsFiltered.length !== 0) {
        phpdoc += `\n *`;
      }
      phpdoc += `\n * @return ${/(\:)\s+([\w_-]+)+/g.exec(target)![2] ?? "mixed"}`;
      phpdoc += `\n */`;
      break;

    // function getA (int $a): number
    case /function\s+([\w_-]+)+/g.test(target):
      /**
       *  FunctionName
       *
       *  @param type ParamName
       *  @param type ParamName
       *
       *  @return String
       */
      let functionFiltered = utils.splitLine(target);
      let paramsFiltered = utils.splitLineComma(target.substring(target.indexOf("(") + 1, target.indexOf(")")));
      phpdoc += `\n/**`;
      phpdoc += `\n * ${utils.clearSpecialCharacters(functionFiltered[2].substring(0, functionFiltered[2].indexOf("(")))}`;
      phpdoc += `\n *`;
      paramsFiltered.forEach((element) => {
        phpdoc += `\n * @param ${utils.wordCount(element) > 1 ? element.trim() : " mixed " + element.trim()}`;
      });
      if (paramsFiltered.length !== 0) {
        phpdoc += `\n *`;
      }
      phpdoc += `\n * @return ${/(\:)\s+([\w_-]+)+/g.exec(target)![2] ?? "mixed"}`;
      phpdoc += `\n */`;
      break;

    // private int $a = 2;
    case /(public|private|protected|var)\s+([^\s]+)\s+(\$|[\w_-])([\w_-]+)\s+\=+/g.test(target):
      /**
       * @var type VarName
       */
      let typedVarFiltered = utils.splitLine(target);
      phpdoc = `\n/**`;
      phpdoc += `\n * @var ${typedVarFiltered[1]} ${typedVarFiltered[2]}`;
      phpdoc += `\n */`;
      break;

    // private $a = 2;
    case /(public|private|protected|var)\s+(\$|[\w_-])([\w_-]+)\s+\=+/g.test(target):
      /**
       * @var VarName
       */
      let varFiltered = utils.splitLine(target);
      phpdoc = `\n/**`;
      phpdoc += `\n * @var ${varFiltered[1]}`;
      phpdoc += `\n */`;
      break;

    // abstract class ClassB | final class ClassC
    case /(abstract|final)\s+(class|enum|interface)\s+([\w_-]+)+/g.test(target):
      /**
       * abstract|final ClassName
       */
      let typedClassFiltered = utils.splitLine(target);
      phpdoc = `\n/**`;
      phpdoc += `\n * ${typedClassFiltered[0]} ${utils.clearSpecialCharacters(typedClassFiltered[2])}`;
      phpdoc += `\n */`;
      break;

    // class ClassA {
    case /(class|enum|interface)\s+([\w_-]+)+/g.test(target):
      /**
       * ClassName
       */
      let classFiltered = utils.splitLine(target);
      phpdoc = `\n/**`;
      phpdoc += `\n * ${utils.clearSpecialCharacters(classFiltered[1])}`;
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
