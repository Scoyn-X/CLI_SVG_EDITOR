import { basename } from 'node:path';
import ts from 'typescript';

/** 同一扫描器检查真实源码及内存正/负例；语法检查不替代人工架构审查。 */
export class SourceConventionChecker {
  public check(file: string, contents: string): readonly string[] {
    const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true);
    const failures: string[] = [];
    const classes: (ts.ClassDeclaration | ts.ClassExpression)[] = [];
    const registries = new Set(['this.providers', 'this.commands']);
    const registryTypes = new Set(['ShapeProvider', 'CommandRegistration']);
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings !== undefined
        && ts.isNamedImports(statement.importClause.namedBindings)) {
        for (const binding of statement.importClause.namedBindings.elements) {
          if (registryTypes.has(binding.propertyName?.text ?? binding.name.text)) { registryTypes.add(binding.name.text); }
        }
      }
      if (ts.isFunctionDeclaration(statement)) { failures.push('top-level function'); }
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (declaration.initializer !== undefined && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
            failures.push('top-level function variable');
          }
        }
      }
    }
    const collect = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) { classes.push(node); }
      if ((ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) && this.registry(node, registryTypes)) {
        registries.add(`${ts.isPropertyDeclaration(node) ? 'this.' : ''}${node.name.getText(source)}`);
      }
      ts.forEachChild(node, collect);
    };
    collect(source);
    if (classes.length > 1) { failures.push('multiple classes'); }
    for (const node of classes) {
      if (node.name?.text !== basename(file, '.ts')) { failures.push('class/file name mismatch'); }
      for (const member of node.members) {
        if (ts.isPropertyDeclaration(member)) {
          const privateField = ts.isPrivateIdentifier(member.name) || this.has(member, ts.SyntaxKind.PrivateKeyword);
          const constant = this.has(member, ts.SyntaxKind.StaticKeyword) && this.has(member, ts.SyntaxKind.ReadonlyKeyword);
          if (!privateField && !constant) { failures.push('unencapsulated property'); }
        }
        if (ts.isConstructorDeclaration(member)) {
          for (const parameter of member.parameters) {
            const property = [ts.SyntaxKind.PublicKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ReadonlyKeyword]
              .some(kind => this.has(parameter, kind));
            if (property && !this.has(parameter, ts.SyntaxKind.PrivateKeyword)) { failures.push('unencapsulated constructor property'); }
          }
        }
      }
    }
    const visit = (node: ts.Node): void => {
      if (ts.isSwitchStatement(node)) { failures.push('switch requires review'); }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'get'
        && registries.has(node.expression.expression.getText(source)) && !['ShapeFactory.ts', 'CommandDispatcher.ts'].includes(basename(file))) {
        failures.push('misplaced name dispatch');
      }
      if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) {
        const pair = [[node.left, node.right], [node.right, node.left]] as const;
        if (pair.some(([literal, operand]) => ts.isStringLiteral(literal) && ['rect', 'circle', 'ellipse', 'line', 'text', 'g'].includes(literal.text)
          && /^(?:tag|type|shapeType)$|\.getTag\(\)$/.test(operand.getText(source)))) { failures.push('shape type comparison requires review'); }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return Object.freeze(failures);
  }

  private has(node: ts.HasModifiers, kind: ts.SyntaxKind): boolean { return ts.getModifiers(node)?.some(modifier => modifier.kind === kind) ?? false; }

  private registry(node: ts.PropertyDeclaration | ts.VariableDeclaration, types: ReadonlySet<string>): boolean {
    const initializer = node.initializer;
    const type = node.type;
    const arguments_ = initializer !== undefined && ts.isNewExpression(initializer) && initializer.expression.getText() === 'Map'
      ? initializer.typeArguments : type !== undefined && ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Map' ? type.typeArguments : undefined;
    const valueType = arguments_?.[1];
    return valueType !== undefined && ts.isTypeReferenceNode(valueType) && types.has(valueType.typeName.getText());
  }
}
