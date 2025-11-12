import { parse } from '@babel/parser';
import _traverse, { type NodePath } from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';
import type { Plugin } from 'vite';

// Handle ESM/CJS interop
const traverse: typeof _traverse = (_traverse as any).default || _traverse;
const generate: typeof _generate = (_generate as any).default || _generate;

interface RaskPluginOptions {
  include?: RegExp;
  exclude?: RegExp;
}

function isJSXReturnStatement(node: t.Node): boolean {
  if (t.isJSXElement(node) || t.isJSXFragment(node)) {
    return true;
  }

  if (t.isReturnStatement(node)) {
    return node.argument ? isJSXReturnStatement(node.argument) : false;
  }

  if (t.isBlockStatement(node)) {
    return node.body.some(isJSXReturnStatement);
  }

  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    // For arrow functions, check the body
    return isJSXReturnStatement(node.body);
  }

  if (t.isConditionalExpression(node)) {
    return isJSXReturnStatement(node.consequent) || isJSXReturnStatement(node.alternate);
  }

  if (t.isLogicalExpression(node)) {
    return isJSXReturnStatement(node.right);
  }

  return false;
}

function isComponentFunction(node: t.Node): boolean {
  // Check if function returns a function that returns JSX
  if (t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    // Handle arrow function with implicit return
    if ((t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) &&
        (t.isArrowFunctionExpression(node.body) || t.isFunctionExpression(node.body))) {
      return isJSXReturnStatement(node.body);
    }

    // Handle functions with block body
    if (t.isBlockStatement(node.body)) {
      const returnStatements = node.body.body.filter(s => t.isReturnStatement(s)) as t.ReturnStatement[];

      return returnStatements.some(ret => {
        if (!ret.argument) return false;
        if (t.isArrowFunctionExpression(ret.argument) || t.isFunctionExpression(ret.argument)) {
          return isJSXReturnStatement(ret.argument);
        }
        return false;
      });
    }
  }

  return false;
}

export function raskPlugin(options: RaskPluginOptions = {}): Plugin {
  const {
    include = /\.(jsx|tsx)$/,
    exclude = /node_modules/,
  } = options;

  return {
    name: 'rask-transform',
    enforce: 'pre',

    transform(code: string, id: string) {
      // Skip if doesn't match include/exclude patterns
      if (!include.test(id) || exclude.test(id)) {
        return null;
      }

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        let hasChanges = false;
        let hasRaskComponentImport = false;

        traverse(ast, {
          ImportDeclaration(path) {
            // Check if RaskComponent is already imported
            if (path.node.source.value === 'rask-ui') {
              const specifiers = path.node.specifiers;
              hasRaskComponentImport = specifiers.some(
                s => t.isImportSpecifier(s) &&
                     t.isIdentifier(s.imported) &&
                     s.imported.name === 'RaskComponent'
              );
            }
          },

          ExportNamedDeclaration(path) {
            const declaration = path.node.declaration;

            if (!declaration) return;

            // Handle export function
            if (t.isFunctionDeclaration(declaration)) {
              if (!declaration.id) return;

              const isComponent = isComponentFunction(declaration);

              if (!isComponent) {
                return;
              }

              hasChanges = true;

              const className = declaration.id.name;
              const setupMethod = t.classProperty(
                t.identifier('setup'),
                t.functionExpression(
                  t.identifier(className),
                  declaration.params,
                  declaration.body,
                  declaration.generator,
                  declaration.async
                )
              );

              const classDeclaration = t.classDeclaration(
                t.identifier(className),
                t.identifier('RaskComponent'),
                t.classBody([setupMethod]),
                []
              );

              path.replaceWith(
                t.exportNamedDeclaration(classDeclaration, [])
              );
              path.skip();
            }

            // Handle export const/let/var
            if (t.isVariableDeclaration(declaration)) {
              const declarator = declaration.declarations[0];

              if (!declarator || !t.isIdentifier(declarator.id)) return;

              const init = declarator.init;
              if (!init || !isComponentFunction(init)) return;

              hasChanges = true;

              const componentName = declarator.id.name;

              let functionExpr: t.FunctionExpression;

              if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
                functionExpr = t.functionExpression(
                  t.identifier(componentName),
                  init.params,
                  t.isExpression(init.body)
                    ? t.blockStatement([t.returnStatement(init.body)])
                    : init.body,
                  init.generator,
                  init.async
                );
              } else {
                return;
              }

              const setupMethod = t.classProperty(
                t.identifier('setup'),
                functionExpr
              );

              const classDeclaration = t.classDeclaration(
                t.identifier(componentName),
                t.identifier('RaskComponent'),
                t.classBody([setupMethod]),
                []
              );

              path.replaceWith(
                t.exportNamedDeclaration(classDeclaration, [])
              );
              path.skip();
            }
          },

          FunctionDeclaration(path) {
            const node = path.node;

            // Skip if not a component function or if it's part of an export
            if (!node.id || !isComponentFunction(node) || path.parent.type === 'ExportNamedDeclaration') {
              return;
            }

            hasChanges = true;

            // Create the class declaration
            const className = node.id.name;
            const setupMethod = t.classProperty(
              t.identifier('setup'),
              t.functionExpression(
                t.identifier(className),
                node.params,
                node.body,
                node.generator,
                node.async
              )
            );

            const classDeclaration = t.classDeclaration(
              t.identifier(className),
              t.identifier('RaskComponent'),
              t.classBody([setupMethod]),
              []
            );

            path.replaceWith(classDeclaration);
            path.skip();
          },

          VariableDeclarator(path) {
            const node = path.node;

            // Check if it's a function component assigned to a variable
            if (!t.isIdentifier(node.id)) return;

            const init = node.init;
            if (!init || !isComponentFunction(init)) return;

            // Skip if it's part of an export
            if (path.parentPath.parent?.type === 'ExportNamedDeclaration') {
              return;
            }

            hasChanges = true;

            const componentName = node.id.name;

            // Create function expression from arrow function or function expression
            let functionExpr: t.FunctionExpression;

            if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
              functionExpr = t.functionExpression(
                t.identifier(componentName),
                init.params,
                t.isExpression(init.body)
                  ? t.blockStatement([t.returnStatement(init.body)])
                  : init.body,
                init.generator,
                init.async
              );
            } else {
              return;
            }

            const setupMethod = t.classProperty(
              t.identifier('setup'),
              functionExpr
            );

            const classDeclaration = t.classDeclaration(
              t.identifier(componentName),
              t.identifier('RaskComponent'),
              t.classBody([setupMethod]),
              []
            );

            // Replace the entire variable declaration with class declaration
            const parentPath = path.parentPath;
            if (t.isVariableDeclaration(parentPath.node) && parentPath.node.declarations.length === 1) {
              parentPath.replaceWith(classDeclaration);
              parentPath.skip();
            }
          },
        });

        // Add import if we made changes and RaskComponent wasn't imported
        if (hasChanges && !hasRaskComponentImport) {
          const importDecl = t.importDeclaration(
            [t.importSpecifier(t.identifier('RaskComponent'), t.identifier('RaskComponent'))],
            t.stringLiteral('rask-ui')
          );
          ast.program.body.unshift(importDecl);
        }

        if (!hasChanges) {
          return null;
        }

        const output = generate(ast, {
          retainLines: false,
          compact: false,
        }, code);

        return {
          code: output.code,
          map: output.map,
        };
      } catch (error) {
        console.error('Error in rask-transform plugin:', error);
        return null;
      }
    },
  };
}
