import { readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const files = readdirSync(resolve('src'), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.ts')).map(entry => resolve(entry.parentPath, entry.name));

describe('课程 OOP 源码规范', () => {
  it('每个生产类在唯一同名文件中，无顶层业务函数和可写公共字段', () => {
    const failures: string[] = [];
    for (const file of files) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const classes = source.statements.filter(ts.isClassDeclaration);
      if (classes.length > 1) { failures.push(`${file}: multiple classes`); }
      for (const node of classes) {
        if (node.name?.text !== basename(file, '.ts')) { failures.push(`${file}: class/file name mismatch`); }
        for (const member of node.members) {
          if (ts.isPropertyDeclaration(member)) {
            const privateField = ts.isPrivateIdentifier(member.name) || ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword);
            const constant = ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword)
              && ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
            if (!privateField && !constant) { failures.push(`${file}: unencapsulated property ${member.name.getText(source)}`); }
          }
          if (ts.isConstructorDeclaration(member)) {
            for (const parameter of member.parameters) {
              if (ts.getModifiers(parameter)?.some(modifier => modifier.kind === ts.SyntaxKind.PublicKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)) {
                failures.push(`${file}: unencapsulated constructor property`);
              }
            }
          }
        }
      }
      for (const node of source.statements) {
        if (ts.isFunctionDeclaration(node)) { failures.push(`${file}: top-level function`); }
      }
    }
    expect(failures).toEqual([]);
  });

  it('领域外不以标签 switch 做图形行为，名字注册查找只在 Dispatcher/Factory', () => {
    const violations: string[] = [];
    for (const file of files) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node): void => {
        if (ts.isSwitchStatement(node)) { violations.push(`${file}: switch requires review`); }
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
          && ['this.providers.get', 'this.commands.get'].includes(node.expression.getText(source))
          && !['ShapeFactory.ts', 'CommandDispatcher.ts'].includes(basename(file))) { violations.push(`${file}: misplaced name dispatch`); }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(violations).toEqual([]);
  });
});
