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

const print = (expr: Semantic.Expression): Editor.Node<Editor.Glyph, ID> => {
    switch (expr.type) {
        case "identifier": {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return Editor.glyph(expr.name);
        }
        case "number": {
            return {
                id: expr.id,
                type: "row",
                children: expr.value.split("").map(char => Editor.glyph(char)),
            };
        }
        case "add": {
            const children: Editor.Node<Editor.Glyph, ID>[] = [];

            for (const arg of expr.args) {
                if (arg.type === "neg" && arg.subtraction) {
                    children.push(Editor.glyph("-"));
                } else {
                    children.push(Editor.glyph("+"));
                }

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
                id: expr.id, // this doesn't really make sense
                type: "row",
                children: children,
            };
        }
        case "mul": {
            const children: Editor.Node<Editor.Glyph, ID>[] = [];

            for (const arg of expr.args) {
                const node = print(arg);
                if (node.type === "row") {
                    if (arg.type === "add" || arg.type === "number") {
                        children.push(Editor.glyph("("));
                    }
                    children.push(...node.children);
                    if (arg.type === "add" || arg.type === "number") {
                        children.push(Editor.glyph(")"));
                    }
                } else {
                    children.push(node);
                }
                if (!expr.implicit) {
                    children.push(Editor.glyph("*"));
                }
            }
            if (!expr.implicit) {
                children.pop(); // remove extra "+"
            }

            return {
                id: expr.id, // this doesn't really make sense
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
                    id: expr.id,
                    type: "row",
                    children: [
                        Editor.glyph("-"),
                        Editor.glyph("("),
                        ...node.children,
                        Editor.glyph(")"),
                    ],
                };
            } else {
                return {
                    id: expr.id,
                    type: "row",
                    children: [Editor.glyph("-"), node],
                };
            }
        }
        case "div": {
            const numerator = print(expr.args[0]);
            const denominator = print(expr.args[1]);
            return {
                id: expr.id,
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
