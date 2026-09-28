import * as acorn from 'acorn';
import type { TraceDiagnostic } from './types';

export interface InstrumentResult {
  success: boolean;
  instrumentedCode?: string;
  functionName?: string;
  error?: TraceDiagnostic;
}

interface TextEdit {
  start: number;
  end: number;
  replacement: string;
}

/**
 * Extracts identifier names from a pattern (Identifier, AssignmentPattern, ArrayPattern, ObjectPattern, RestElement).
 */
function extractNames(pattern: any): string[] {
  if (!pattern) return [];
  if (pattern.type === 'Identifier') return [pattern.name];
  if (pattern.type === 'AssignmentPattern') return extractNames(pattern.left);
  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.flatMap((e: any) => extractNames(e));
  }
  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.flatMap((p: any) => extractNames(p.value || p.argument));
  }
  if (pattern.type === 'RestElement') return extractNames(pattern.argument);
  return [];
}

/**
 * Instruments user JavaScript source code with __vc.step(line, locals) and __vc.enter()/leave() calls.
 * Uses Acorn AST range offsets to rewrite statements cleanly without external code generators.
 */
export function instrumentCode(source: string): InstrumentResult {
  let ast: any;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      locations: true,
      ranges: true,
      allowReturnOutsideFunction: true,
    });
  } catch (err: any) {
    const line = err.loc?.line;
    return {
      success: false,
      error: {
        kind: 'syntax-error',
        line,
        message: err.message || 'Syntax error in JavaScript code',
        suggestion: `Check syntax near line ${line || 1}.`,
      },
    };
  }

  let mainFunctionName = 'solution';
  const edits: TextEdit[] = [];

  // Find the primary entry function name if present
  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      mainFunctionName = node.id.name;
      break;
    }
  }

  /**
   * Helper to format locals into a JS object string: e.g. "{ a, b, c }"
   */
  function formatLocals(vars: string[]): string {
    const unique = Array.from(new Set(vars)).filter(
      (v) => v && !['this', 'arguments', '__vc', '__vc_ret'].includes(v)
    );
    return `{ ${unique.join(', ')} }`;
  }

  /**
   * Recursively walks AST nodes and schedules text edits
   */
  function walk(node: any, activeVars: string[]) {
    if (!node) return;

    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        const paramNames = (node.params || []).flatMap(extractNames);
        const scopedVars = [...activeVars, ...paramNames];

        if (node.body && node.body.type === 'BlockStatement') {
          // Insert __vc.enter() and initial function step right after '{'
          const line = node.loc.start.line;
          const openBraceIndex = node.body.start + 1;
          const localsObj = formatLocals(paramNames);
          edits.push({
            start: openBraceIndex,
            end: openBraceIndex,
            replacement: `\n  __vc.enter(); __vc.step(${line}, ${localsObj});\n`,
          });

          // Insert __vc.leave() before '}'
          const closeBraceIndex = node.body.end - 1;
          edits.push({
            start: closeBraceIndex,
            end: closeBraceIndex,
            replacement: `\n  __vc.leave();\n`,
          });

          walkBlock(node.body, scopedVars);
        }
        break;
      }

      case 'BlockStatement': {
        walkBlock(node, activeVars);
        break;
      }

      default:
        break;
    }
  }

  function walkBlock(blockNode: any, initialVars: string[]) {
    let currentVars = [...initialVars];

    for (const stmt of blockNode.body || []) {
      const line = stmt.loc.start.line;

      if (stmt.type === 'VariableDeclaration') {
        const newNames = (stmt.declarations || []).flatMap((d: any) => extractNames(d.id));
        currentVars = [...currentVars, ...newNames];
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.end,
          end: stmt.end,
          replacement: `\n__vc.step(${line}, ${localsObj});`,
        });
      } else if (stmt.type === 'ExpressionStatement') {
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.end,
          end: stmt.end,
          replacement: `\n__vc.step(${line}, ${localsObj});`,
        });
      } else if (stmt.type === 'ReturnStatement') {
        const localsObj = formatLocals(currentVars);
        if (stmt.argument) {
          const argText = source.slice(stmt.argument.start, stmt.argument.end);
          const localsWithoutBraces = localsObj.slice(1, -1).trim();
          const returnLocals = localsWithoutBraces.length > 0
            ? `{ ${localsWithoutBraces}, return: __vc_ret }`
            : `{ return: __vc_ret }`;

          edits.push({
            start: stmt.start,
            end: stmt.end,
            replacement: `{ const __vc_ret = (${argText}); __vc.step(${line}, ${returnLocals}); return __vc_ret; }`,
          });
        } else {
          edits.push({
            start: stmt.start,
            end: stmt.end,
            replacement: `{ __vc.step(${line}, { return: undefined }); return; }`,
          });
        }
      } else if (stmt.type === 'IfStatement') {
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.start,
          end: stmt.start,
          replacement: `__vc.step(${line}, ${localsObj});\n`,
        });

        if (stmt.consequent) {
          if (stmt.consequent.type === 'BlockStatement') {
            walk(stmt.consequent, currentVars);
          } else {
            edits.push({
              start: stmt.consequent.start,
              end: stmt.consequent.start,
              replacement: '{ ',
            });
            edits.push({
              start: stmt.consequent.end,
              end: stmt.consequent.end,
              replacement: ' }',
            });
            walkBlock({ body: [stmt.consequent] }, currentVars);
          }
        }

        if (stmt.alternate) {
          if (stmt.alternate.type === 'BlockStatement' || stmt.alternate.type === 'IfStatement') {
            walk(stmt.alternate, currentVars);
          } else {
            edits.push({
              start: stmt.alternate.start,
              end: stmt.alternate.start,
              replacement: '{ ',
            });
            edits.push({
              start: stmt.alternate.end,
              end: stmt.alternate.end,
              replacement: ' }',
            });
            walkBlock({ body: [stmt.alternate] }, currentVars);
          }
        }
      } else if (
        stmt.type === 'WhileStatement' ||
        stmt.type === 'DoWhileStatement' ||
        stmt.type === 'ForStatement' ||
        stmt.type === 'ForOfStatement' ||
        stmt.type === 'ForInStatement'
      ) {
        let loopVars = [...currentVars];
        if (stmt.type === 'ForStatement' && stmt.init?.type === 'VariableDeclaration') {
          const initNames = stmt.init.declarations.flatMap((d: any) => extractNames(d.id));
          loopVars = [...loopVars, ...initNames];
        } else if (
          (stmt.type === 'ForOfStatement' || stmt.type === 'ForInStatement') &&
          stmt.left?.type === 'VariableDeclaration'
        ) {
          const leftNames = stmt.left.declarations.flatMap((d: any) => extractNames(d.id));
          loopVars = [...loopVars, ...leftNames];
        }

        const localsObj = formatLocals(loopVars);

        if (stmt.body) {
          if (stmt.body.type === 'BlockStatement') {
            edits.push({
              start: stmt.body.start + 1,
              end: stmt.body.start + 1,
              replacement: `\n  __vc.step(${line}, ${localsObj});\n`,
            });
            walkBlock(stmt.body, loopVars);
          } else {
            edits.push({
              start: stmt.body.start,
              end: stmt.body.start,
              replacement: `{\n  __vc.step(${line}, ${localsObj});\n  `,
            });
            edits.push({
              start: stmt.body.end,
              end: stmt.body.end,
              replacement: '\n}',
            });
            walkBlock({ body: [stmt.body] }, loopVars);
          }
        }
      } else {
        walk(stmt, currentVars);
      }
    }
  }

  // Walk all top-level statements
  for (const node of ast.body) {
    walk(node, []);
  }

  // Apply edits from bottom to top to preserve character offsets
  edits.sort((a, b) => b.start - a.start || b.end - a.end);

  let result = source;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }

  return {
    success: true,
    instrumentedCode: result,
    functionName: mainFunctionName,
  };
}
