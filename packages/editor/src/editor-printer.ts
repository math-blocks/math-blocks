/**
 * Converts a Semantic AST to an Editor AST.
 */

import * as Semantic from "@math-blocks/semantic";
import * as Editor from "./editor-ast";

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

type ID = {
    id: number;
};

// TODO: write more tests for this
// TODO: have a top-evel function that returns an Editor.Row
const print = (expr: Semantic.Expression): Editor.Node<Editor.Glyph, ID> => {
    switch (expr.type) {
        case "identifier": {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return Editor.glyph(expr.name);
        }
        case "number": {
            return {
                id: expr.id, // TODO: generate a new id
                type: "row",
                children: expr.value
                    .split("")
                    .map((char) => Editor.glyph(char)),
            };
        }
        case "add": {
            const children: Editor.Node<Editor.Glyph, ID>[] = [];

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

            return {
                id: expr.id, // TODO: generate a new id
                type: "row",
                children: children,
            };
        }
        case "mul": {
            const children: Editor.Node<Editor.Glyph, ID>[] = [];

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

            return {
                id: expr.id, // TODO: generate a new id
                type: "row",
                children: children,
            };
        }
        case "neg": {
            const node = print(expr.arg);
            if (
                node.type === "row" &&
                expr.arg.type !== "number" &&
                expr.arg.type !== "identifier"
            ) {
                return {
                    id: expr.id, // TODO: generate a new id
                    type: "row",
                    children: [
                        Editor.glyph("\u2212"),
                        Editor.glyph("("),
                        ...node.children,
                        Editor.glyph(")"),
                    ],
                };
            } else if (node.type === "row") {
                return {
                    id: expr.id, // TODO: generate a new id
                    type: "row",
                    children: [Editor.glyph("\u2212"), ...node.children],
                };
            } else {
                return {
                    id: expr.id, // TODO: generate a new id
                    type: "row",
                    children: [Editor.glyph("\u2212"), node],
                };
            }
        }
        case "div": {
            const numerator = print(expr.args[0]);
            const denominator = print(expr.args[1]);
            return {
                id: expr.id, // TODO: generate a new id
                type: "frac",
                children: [
                    numerator.type === "row"
                        ? numerator
                        : Editor.row([numerator]),
                    denominator.type === "row"
                        ? denominator
                        : Editor.row([denominator]),
                ],
            };
        }
        default: {
            throw new Error("print doesn't handle this case yet");
        }
    }
};

export default print;
