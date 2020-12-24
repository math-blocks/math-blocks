/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

import * as Editor from "./editor-ast";

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

const getChildren = (
    expr: Semantic.Types.Node,
    oneToOne: boolean,
): Editor.Node[] => {
    const children: Editor.Node[] = [];

    const node = print(expr, oneToOne);
    if (node.type === "row") {
        children.push(...node.children);
    } else {
        children.push(node);
    }

    return children;
};

// TODO: write more tests for this
const print = (expr: Semantic.Types.Node, oneToOne: boolean): Editor.Node => {
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
                const node = print(arg, oneToOne);
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

            const wrapAll = expr.args.some((arg, index) => {
                if (arg.type === "number") {
                    return true;
                }
                if (arg.type === "neg" && (index > 0 || oneToOne)) {
                    return true;
                }
                if (arg.type === "div") {
                    return true;
                }
                return false;
            });

            for (const arg of expr.args) {
                // TODO: we probably also want to wrap things like (a * b)(x * y)
                const wrap = (wrapAll && expr.implicit) || arg.type === "add";

                if (wrap) {
                    children.push(Editor.glyph("("));
                }

                children.push(...getChildren(arg, oneToOne));

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
            if (
                expr.arg.type === "number" ||
                expr.arg.type === "identifier" ||
                (expr.arg.type === "neg" && !expr.arg.subtraction) ||
                (expr.arg.type === "mul" && expr.arg.implicit) ||
                expr.arg.type === "pow" // pow has a higher precedence
            ) {
                return Editor.row([
                    Editor.glyph("\u2212"),
                    ...getChildren(expr.arg, oneToOne),
                ]);
            } else {
                return Editor.row([
                    Editor.glyph("\u2212"),
                    Editor.glyph("("),
                    ...getChildren(expr.arg, oneToOne),
                    Editor.glyph(")"),
                ]);
            }
        }
        case "div": {
            const numerator = print(expr.args[0], oneToOne);
            const denominator = print(expr.args[1], oneToOne);
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
                children.push(...getChildren(arg, oneToOne));
                children.push(Editor.glyph("="));
            }

            children.pop(); // remove extra "="

            return Editor.row(children);
        }
        case "pow": {
            const {base, exp} = expr;

            if (base.type === "identifier" || base.type === "number") {
                return Editor.row([
                    ...getChildren(base, oneToOne),
                    Editor.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            } else {
                return Editor.row([
                    Editor.glyph("("),
                    ...getChildren(base, oneToOne),
                    Editor.glyph(")"),
                    Editor.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            }
        }
        case "parens": {
            const children: Editor.Node[] = [
                Editor.glyph("("),
                ...getChildren(expr.arg, oneToOne),
                Editor.glyph(")"),
            ];

            return Editor.row(children);
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};

export default (expr: Semantic.Types.Node, oneToOne = false): Editor.Row => {
    const node = print(expr, oneToOne);
    if (node.type === "row") {
        return node;
    }
    return Editor.row([node]);
};
