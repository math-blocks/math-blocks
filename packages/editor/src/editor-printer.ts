/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

import * as Editor from "./editor-ast";

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

// TODO: write more tests for this
const print = (expr: Semantic.Types.Node): Editor.Node => {
    switch (expr.type) {
        case "identifier": {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return Editor.glyph(expr.name);
        }
        case "number": {
            // How do we avoid creating a bunch of ids that we immediately
            // throw away because this number is part of a larger expression
            // and thus contained within a larger row?
            return Editor.row(
                expr.value.split("").map((char) => Editor.glyph(char)),
            );
        }
        case "add": {
            const children: Editor.Node[] = [];

            for (const arg of expr.args) {
                if (arg.type === "neg" && arg.subtraction) {
                    children.push(Editor.glyph("\u2212"));
                } else {
                    children.push(Editor.glyph("+"));
                }

                // number is returned as a row so if we do this check, every
                // number will be encapsulated in parens.
                const node = print(arg);
                if (node.type === "row") {
                    if (arg.type === "add") {
                        children.push(Editor.glyph("("));
                    }
                    if (arg.type === "neg" && arg.subtraction) {
                        // strip off the leading "-"
                        children.push(...node.children.slice(1));
                    } else {
                        children.push(...node.children);
                    }
                    if (arg.type === "add") {
                        children.push(Editor.glyph(")"));
                    }
                } else {
                    children.push(node);
                }
            }
            children.shift(); // remove extra "+"

            return Editor.row(children);
        }
        case "mul": {
            const children: Editor.Node[] = [];

            const wrapAll = expr.args.slice(1).some((arg) => {
                if (arg.type === "number") {
                    return true;
                }
                if (arg.type === "neg" && arg.arg.type === "number") {
                    return true;
                }
                return false;
            });

            for (const arg of expr.args) {
                const node = print(arg);
                const wrap = (wrapAll && expr.implicit) || arg.type === "add";

                if (wrap) {
                    children.push(Editor.glyph("("));
                }

                if (node.type === "row") {
                    children.push(...node.children);
                } else {
                    children.push(node);
                }

                if (wrap) {
                    children.push(Editor.glyph(")"));
                }

                if (!expr.implicit) {
                    children.push(Editor.glyph("*"));
                }
            }

            if (!expr.implicit) {
                children.pop(); // remove extra "*"
            }

            return Editor.row(children);
        }
        case "neg": {
            const node = print(expr.arg);
            if (
                node.type === "row" &&
                expr.arg.type !== "number" &&
                expr.arg.type !== "identifier"
            ) {
                return Editor.row([
                    Editor.glyph("\u2212"),
                    Editor.glyph("("),
                    ...node.children,
                    Editor.glyph(")"),
                ]);
            } else if (node.type === "row") {
                return Editor.row([Editor.glyph("\u2212"), ...node.children]);
            } else {
                return Editor.row([Editor.glyph("\u2212"), node]);
            }
        }
        case "div": {
            const numerator = print(expr.args[0]);
            const denominator = print(expr.args[1]);
            return Editor.frac(
                numerator.type === "row" ? numerator.children : [numerator],
                denominator.type === "row"
                    ? denominator.children
                    : [denominator],
            );
        }
        case "eq": {
            const children: Editor.Node[] = [];

            for (const arg of expr.args) {
                const node = print(arg);
                if (node.type === "row") {
                    children.push(...node.children);
                } else {
                    children.push(node);
                }
                children.push(Editor.glyph("="));
            }

            children.pop(); // remove extra "="

            return Editor.row(children);
        }
        case "exp": {
            const children: Editor.Node[] = [];

            const base = print(expr.base);
            if (base.type === "row") {
                children.push(...base.children);
            } else {
                children.push(base);
            }

            const exp = print(expr.exp);
            children.push(
                Editor.subsup(
                    undefined,
                    exp.type === "row" ? exp.children : [exp],
                ),
            );

            return Editor.row(children);
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};

export default (expr: Semantic.Types.Node): Editor.Row => {
    const node = print(expr);
    if (node.type === "row") {
        return node;
    }
    return Editor.row([node]);
};
