import * as acorn from 'acorn';
import type { TraceDiagnostic } from './types';

export interface AstIndexAnalysis {
  indexVariables: string[];
  coordinatePairs: [string, string][];
}

export interface InstrumentResult {
  success: boolean;
  instrumentedCode?: string;
  functionName?: string;
  detectedIndexVariables?: string[];
  detectedCoordinatePairs?: [string, string][];
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
 * Recursively analyzes the AST to discover variable identifiers that are used as array or grid indices
 * (e.g. `arr[k]`, `nums[myVar]`, `matrix[r][c]`, `arr[cond ? a : b]`, `arr[i + 1]`).
 * Excludes offsets (e.g. `offset` in `arr[i + offset]`) and loop counters that never index an array.
 */
export function analyzeAstIndexUsage(ast: any): AstIndexAnalysis {
  const detected = new Set<string>();
  const coordinatePairs: [string, string][] = [];
  const ignored = new Set([
    'this',
    'arguments',
    '__vc',
    '__vc_ret',
    'undefined',
    'null',
    'true',
    'false',
  ]);

  function extractExprIdentifiers(expr: any) {
    if (!expr || typeof expr !== 'object') return;
    if (expr.type === 'Identifier') {
      if (!ignored.has(expr.name)) {
        detected.add(expr.name);
      }
    } else if (expr.type === 'ConditionalExpression') {
      // Ternary indexing: arr[cond ? a : b] -> extract a and b
      extractExprIdentifiers(expr.consequent);
      extractExprIdentifiers(expr.alternate);
    } else if (expr.type === 'BinaryExpression') {
      // In arr[i + 1], arr[i - k], arr[i + offset]:
      // The base pointer is the left operand (or right if left is a literal, e.g. 1 + i).
      // The right-hand offset (e.g. `offset`, `k`, `1`) is excluded.
      if (expr.operator === '+' || expr.operator === '-') {
        if (expr.left?.type === 'Identifier') {
          extractExprIdentifiers(expr.left);
        } else if (expr.left?.type === 'Literal' && expr.right?.type === 'Identifier') {
          extractExprIdentifiers(expr.right);
        } else {
          extractExprIdentifiers(expr.left);
        }
      }
    } else if (expr.type === 'UnaryExpression' || expr.type === 'UpdateExpression') {
      extractExprIdentifiers(expr.argument);
    }
  }

  function walkAst(node: any) {
    if (!node || typeof node !== 'object') return;

    // 1. 2D nested MemberExpression: e.g. matrix[r][c] or grid[row][col]
    if (
      node.type === 'MemberExpression' &&
      node.computed &&
      node.object?.type === 'MemberExpression' &&
      node.object.computed
    ) {
      const rowProp = node.object.property;
      const colProp = node.property;
      if (rowProp?.type === 'Identifier' && colProp?.type === 'Identifier') {
        if (!ignored.has(rowProp.name) && !ignored.has(colProp.name)) {
          coordinatePairs.push([rowProp.name, colProp.name]);
        }
      }
    }

    // 2. Computed MemberExpression: e.g. arr[k], nums[myPointer], arr[cond ? a : b]
    if (node.type === 'MemberExpression' && node.computed) {
      extractExprIdentifiers(node.property);
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === 'object' && c.type) walkAst(c);
        }
      } else if (child && typeof child === 'object' && child.type) {
        walkAst(child);
      }
    }
  }

  walkAst(ast);
  return {
    indexVariables: Array.from(detected),
    coordinatePairs,
  };
}

export function collectIndexVariables(ast: any): string[] {
  return analyzeAstIndexUsage(ast).indexVariables;
}

/**
 * Instruments user JavaScript source code with __vc.step(line, locals) and __vc.enter()/leave() calls.
 * Uses Acorn AST range offsets to rewrite statements cleanly without external code generators.
 * Supports Function declarations/expressions, arrows (block & expression bodies),
 * TryStatement, SwitchStatement, loop statements, and class methods (F-LDR-S1-02).
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

  // Find the primary entry function name (first FunctionDeclaration, F-LDR-S1-03)
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
   * Recursively traverses expression AST nodes to instrument nested functions
   */
  function walkExpression(expr: any, vars: string[]) {
    if (!expr || typeof expr !== 'object') return;
    if (
      expr.type === 'ArrowFunctionExpression' ||
      expr.type === 'FunctionExpression' ||
      expr.type === 'ClassExpression'
    ) {
      walk(expr, vars);
      return;
    }
    for (const key of Object.keys(expr)) {
      if (key === 'loc' || key === 'range') continue;
      const val = expr[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && item.type) {
            walkExpression(item, vars);
          }
        }
      } else if (val && typeof val === 'object' && val.type) {
        walkExpression(val, vars);
      }
    }
  }

  /**
   * Recursively walks AST nodes and schedules text edits
   */
  function walk(node: any, activeVars: string[]) {
    if (!node) return;

    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression': {
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

      case 'ArrowFunctionExpression': {
        const paramNames = (node.params || []).flatMap(extractNames);
        const scopedVars = [...activeVars, ...paramNames];
        const line = node.loc.start.line;

        if (node.body && node.body.type === 'BlockStatement') {
          const openBraceIndex = node.body.start + 1;
          const localsObj = formatLocals(paramNames);
          edits.push({
            start: openBraceIndex,
            end: openBraceIndex,
            replacement: `\n  __vc.enter(); __vc.step(${line}, ${localsObj});\n`,
          });

          const closeBraceIndex = node.body.end - 1;
          edits.push({
            start: closeBraceIndex,
            end: closeBraceIndex,
            replacement: `\n  __vc.leave();\n`,
          });

          walkBlock(node.body, scopedVars);
        } else if (node.body) {
          // Expression-body arrow function: e.g. (x, y) => x + y
          const bodyText = source.slice(node.body.start, node.body.end);
          const localsObj = formatLocals(scopedVars);
          const localsWithoutBraces = localsObj.slice(1, -1).trim();
          const returnLocals =
            localsWithoutBraces.length > 0
              ? `{ ${localsWithoutBraces}, return: __vc_ret }`
              : `{ return: __vc_ret }`;

          edits.push({
            start: node.body.start,
            end: node.body.end,
            replacement: `{\n  __vc.enter();\n  const __vc_ret = (${bodyText});\n  __vc.step(${line}, ${returnLocals});\n  __vc.leave();\n  return __vc_ret;\n}`,
          });
          walkExpression(node.body, scopedVars);
        }
        break;
      }

      case 'ClassDeclaration':
      case 'ClassExpression': {
        for (const member of node.body?.body || []) {
          if (member.type === 'MethodDefinition' && member.value) {
            walk(member.value, activeVars);
          }
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
        for (const d of stmt.declarations || []) {
          if (d.init) walkExpression(d.init, currentVars);
        }
      } else if (stmt.type === 'ExpressionStatement') {
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.end,
          end: stmt.end,
          replacement: `\n__vc.step(${line}, ${localsObj});`,
        });
        if (stmt.expression) {
          walkExpression(stmt.expression, currentVars);
        }
      } else if (stmt.type === 'ReturnStatement') {
        const localsObj = formatLocals(currentVars);
        if (stmt.argument) {
          const argText = source.slice(stmt.argument.start, stmt.argument.end);
          const localsWithoutBraces = localsObj.slice(1, -1).trim();
          const returnLocals =
            localsWithoutBraces.length > 0
              ? `{ ${localsWithoutBraces}, return: __vc_ret }`
              : `{ return: __vc_ret }`;

          edits.push({
            start: stmt.start,
            end: stmt.end,
            replacement: `{ const __vc_ret = (${argText}); __vc.step(${line}, ${returnLocals}); return __vc_ret; }`,
          });
          walkExpression(stmt.argument, currentVars);
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
        if (stmt.test) {
          walkExpression(stmt.test, currentVars);
        }

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
      } else if (stmt.type === 'TryStatement') {
        // Instrument TryStatement (F-LDR-S1-02)
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.start,
          end: stmt.start,
          replacement: `__vc.step(${line}, ${localsObj});\n`,
        });

        if (stmt.block) {
          walkBlock(stmt.block, currentVars);
        }

        if (stmt.handler) {
          const handlerLine = stmt.handler.loc.start.line;
          const catchParamNames = extractNames(stmt.handler.param);
          const catchVars = [...currentVars, ...catchParamNames];
          if (stmt.handler.body) {
            const catchLocals = formatLocals(catchVars);
            edits.push({
              start: stmt.handler.body.start + 1,
              end: stmt.handler.body.start + 1,
              replacement: `\n  if (__vc.isAborted) throw __vc.fatalError;\n  __vc.step(${handlerLine}, ${catchLocals});\n`,
            });
            walkBlock(stmt.handler.body, catchVars);
          }
        }

        if (stmt.finalizer) {
          const finalizerLine = stmt.finalizer.loc.start.line;
          const finalLocals = formatLocals(currentVars);
          edits.push({
            start: stmt.finalizer.start + 1,
            end: stmt.finalizer.start + 1,
            replacement: `\n  if (__vc.isAborted) throw __vc.fatalError;\n  __vc.step(${finalizerLine}, ${finalLocals});\n`,
          });
          walkBlock(stmt.finalizer, currentVars);
        }
      } else if (stmt.type === 'SwitchStatement') {
        // Instrument SwitchStatement (F-LDR-S1-02)
        const localsObj = formatLocals(currentVars);
        edits.push({
          start: stmt.start,
          end: stmt.start,
          replacement: `__vc.step(${line}, ${localsObj});\n`,
        });
        if (stmt.discriminant) {
          walkExpression(stmt.discriminant, currentVars);
        }

        for (const switchCase of stmt.cases || []) {
          const caseLine = switchCase.loc.start.line;
          if (switchCase.test) {
            walkExpression(switchCase.test, currentVars);
          }
          if (switchCase.consequent && switchCase.consequent.length > 0) {
            edits.push({
              start: switchCase.consequent[0].start,
              end: switchCase.consequent[0].start,
              replacement: `__vc.step(${caseLine}, ${localsObj});\n`,
            });
            walkBlock({ body: switchCase.consequent }, currentVars);
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
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations || []) {
        if (d.init) walkExpression(d.init, []);
      }
    } else if (node.type === 'ExpressionStatement') {
      if (node.expression) walkExpression(node.expression, []);
    } else {
      walk(node, []);
    }
  }

  // Apply edits from bottom to top to preserve character offsets
  edits.sort((a, b) => b.start - a.start || b.end - a.end);

  let result = source;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }

  const analysis = analyzeAstIndexUsage(ast);

  return {
    success: true,
    instrumentedCode: result,
    functionName: mainFunctionName,
    detectedIndexVariables: analysis.indexVariables,
    detectedCoordinatePairs: analysis.coordinatePairs,
  };
}
