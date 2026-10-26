/** Finds letter-bearing string literals inside JSX expressions. */
import ts from "typescript";

export const hasLetter = (s: string): boolean =>
  /\p{L}/u.test(s.replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ""));

/** Letter-bearing string literals reachable through ternaries, &&, ||, ??, parens and casts. */
export function literalsIn(node: ts.Node, out: ts.Node[] = []): ts.Node[] {
  if (ts.isStringLiteralLike(node)) {
    if (hasLetter(node.text)) out.push(node);
  } else if (ts.isTemplateExpression(node)) {
    const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
    if (parts.some(hasLetter)) out.push(node);
  } else if (ts.isConditionalExpression(node)) {
    literalsIn(node.whenTrue, out);
    literalsIn(node.whenFalse, out);
  } else if (ts.isBinaryExpression(node)) {
    literalsIn(node.right, out);
    if (!(node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken))
      literalsIn(node.left, out);
  } else if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    literalsIn(node.expression, out);
  }
  return out;
}
