import { Engine } from "php-parser";
import {
  CodeActionProvider,
  Range,
  TextDocument,
  CodeAction,
  CodeActionKind,
  WorkspaceEdit,
  languages,
  Position,
} from "vscode";
import { getLine } from "../utils";

export class CodeHelper implements CodeActionProvider {
  public provideCodeActions(document: TextDocument, range: Range): CodeAction[] | undefined {
    const codeActions: Array<CodeAction> = [];

    // const arrayPushToAssignment = this.arrayPushToAssignment(document, range);
    // if (arrayPushToAssignment) {
    //   codeActions.push(arrayPushToAssignment);
    // }

    const addStrictTypes = this.addStrictTypes(document, range);
    if (addStrictTypes) {
      codeActions.push(addStrictTypes);
    }

    return codeActions;
  }

  public codeAction = languages.registerCodeActionsProvider("php", this);

  private addStrictTypes(document: TextDocument, range: Range): CodeAction | undefined {
    const entireLine = getLine(document, range);
    if (!entireLine.includes("<?php")) {
      return;
    }

    const parser = new Engine({
      parser: {
        extractDoc: true,
      },
      ast: {
        withPositions: true,
        withSource: true,
      },
    });

    let hasStrictTypes = false;
    const tree = parser.parseCode(document.getText(), "foo.php");
    tree.children.forEach((node) => {
      if (node.kind === "declare") {
        // @ts-ignore
        if (node["directives"][0].key.name === "strict_types") {
          hasStrictTypes = true;
        }
      }
    });

    if (hasStrictTypes) {
      return;
    }

    const fix = new CodeAction("Declare strict types", CodeActionKind.QuickFix);
    fix.edit = new WorkspaceEdit();
    fix.edit.insert(document.uri, new Position(range.start.line + 1, 0), `\ndeclare(strict_types=1);\n`);

    return fix;
  }

  // private arrayPushToAssignment(document: TextDocument, range: Range): CodeAction | undefined {
  //   const entireLine = getLine(document, range);
  //   if (!entireLine.includes("array_push")) {
  //     return;
  //   }
  //   const fix = new CodeAction(`replace array_push($array, $value) with $array[] = $value`, CodeActionKind.Refactor);
  //   fix.edit = new WorkspaceEdit();
  //   // fix.edit.replace(document.uri, new Range(range.start, range.))
  //   return fix;
  // }
}
