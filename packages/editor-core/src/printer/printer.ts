/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

import * as types from "../ast/types";
import * as builders from "../ast/builders";

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

const getChildren = (
    expr: Semantic.types.Node,
    oneToOne: boolean,
): types.CharNode[] => {
    const children: types.CharNode[] = [];

    const node = _print(expr, oneToOne);
    if (node.type === "row") {
        children.push(...node.children);
    } else {
        children.push(node);
    }

    return children;
};

// TODO: write more tests for this
const _print = (
    expr: Semantic.types.Node,
    oneToOne: boolean,
): types.CharNode => {
    switch (expr.type) {
        case "identifier": {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return builders.char(expr.name);
        }
        case "number": {
            // How do we avoid creating a bunch of ids that we immediately
            // throw away because this number is part of a larger expression
            // and thus contained within a larger row?
            return builders.row(
                expr.value.split("").map((char) => builders.char(char)),
            );
        }
        case "add": {
            const children: types.CharNode[] = [];

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (i > 0) {
                    if (arg.type === "neg" && arg.subtraction) {
                        children.push(builders.char("\u2212"));
                    } else {
                        children.push(builders.char("+"));
                    }
                } else {
                    if (arg.type === "neg" && arg.subtraction) {
                        console.warn(
                            "leading subtraction term should be simple negation",
                        );
                        children.push(builders.char("\u2212"));
                    }
                }

                // number is returned as a row so if we do this check, every
                // number will be encapsulated in parens.
                const node = _print(arg, oneToOne);
                if (node.type === "row") {
                    const inner =
                        arg.type === "neg" && arg.subtraction
                            ? // strip off the leading "-"
                              node.children.slice(1)
                            : node.children;

                    if (arg.type === "add") {
                        children.push(
                            builders.delimited(
                                inner,
                                builders.char("("),
                                builders.char(")"),
                            ),
                        );
                    } else {
                        children.push(...inner);
                    }
                } else {
                    children.push(node);
                }
            }

            return builders.row(children);
        }
        case "mul": {
            const children: types.CharNode[] = [];

            const wrapAll = expr.args.some((arg, index) => {
                if (arg.type === "number" && index > 0) {
                    return true;
                }
                if (arg.type === "neg" && (index > 0 || oneToOne)) {
                    return true;
                }
                if (arg.type === "div" && expr.implicit && index > 0) {
                    return true;
                }
                if (arg.type === "mul" && expr.implicit) {
                    return true;
                }
                return false;
            });

            for (const arg of expr.args) {
                // TODO: we probably also want to wrap things like (a * b)(x * y)
                const wrap = (wrapAll && expr.implicit) || arg.type === "add";

                if (wrap) {
                    children.push(
                        builders.delimited(
                            getChildren(arg, oneToOne),
                            builders.char("("),
                            builders.char(")"),
                        ),
                    );
                } else {
                    children.push(...getChildren(arg, oneToOne));
                }

                if (!expr.implicit) {
                    children.push(builders.char("\u00B7"));
                }
            }

            if (!expr.implicit) {
                children.pop(); // remove extra "*"
            }

            return builders.row(children);
        }
        case "neg": {
            if (
                expr.arg.type === "number" ||
                expr.arg.type === "identifier" ||
                expr.arg.type === "div" ||
                (expr.arg.type === "neg" && !expr.arg.subtraction) ||
                (expr.arg.type === "mul" && expr.arg.implicit) ||
                expr.arg.type === "pow" // pow has a higher precedence
            ) {
                return builders.row([
                    builders.char("\u2212"),
                    ...getChildren(expr.arg, oneToOne),
                ]);
            } else {
                return builders.row([
                    builders.char("\u2212"),
                    builders.delimited(
                        getChildren(expr.arg, oneToOne),
                        builders.char("("),
                        builders.char(")"),
                    ),
                ]);
            }
        }
        case "div": {
            const numerator = _print(expr.args[0], oneToOne);
            const denominator = _print(expr.args[1], oneToOne);
            return builders.frac(
                numerator.type === "row" ? numerator.children : [numerator],
                denominator.type === "row"
                    ? denominator.children
                    : [denominator],
            );
        }
        case "eq": {
            const children: types.CharNode[] = [];

            for (const arg of expr.args) {
                children.push(...getChildren(arg, oneToOne));
                children.push(builders.char("="));
            }

            children.pop(); // remove extra "="

            return builders.row(children);
        }
        case "pow": {
            const {base, exp} = expr;

            if (base.type === "identifier" || base.type === "number") {
                return builders.row([
                    ...getChildren(base, oneToOne),
                    builders.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            } else {
                return builders.row([
                    builders.delimited(
                        getChildren(base, oneToOne),
                        builders.char("("),
                        builders.char(")"),
                    ),
                    builders.subsup(undefined, getChildren(exp, oneToOne)),
                ]);
            }
        }
        case "parens": {
            const children: types.CharNode[] = [
                builders.delimited(
                    getChildren(expr.arg, oneToOne),
                    builders.char("("),
                    builders.char(")"),
                ),
            ];

            return builders.row(children);
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};

export const print = (
    expr: Semantic.types.Node,
    oneToOne = false,
): types.CharRow => {
    const node = _print(expr, oneToOne);
    if (node.type === "row") {
        return node;
    }
    return builders.row([node]);
};
