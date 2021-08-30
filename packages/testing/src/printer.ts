/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

const {NodeType} = Semantic;

// TODO: Use the operator precedence numbers from text-parser to determine when
// to add parens (or not).

// TODO: handle the case when there's a neg.sub node at the start of an expression

export const print = (expr: Semantic.types.Node, oneToOne = false): string => {
    switch (expr.type) {
        case NodeType.Identifier: {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return expr.name;
        }
        case NodeType.Number: {
            // How do we avoid creating a bunch of ids that we immediately
            // throw away because this number is part of a larger expression
            // and thus contained within a larger row?
            return expr.value;
        }
        case NodeType.Add: {
            let result = "";

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (i > 0) {
                    if (Semantic.util.isSubtraction(arg)) {
                        result += " - ";
                    } else {
                        result += " + ";
                    }
                } else if (Semantic.util.isSubtraction(arg)) {
                    console.warn(
                        "leading subtraction term should be simple negation",
                    );
                    result += "-";
                }

                if (
                    arg.type === NodeType.Number ||
                    arg.type === NodeType.Identifier ||
                    arg.type === NodeType.Mul ||
                    arg.type === NodeType.Div ||
                    arg.type === NodeType.Power ||
                    (arg.type === NodeType.Neg && !arg.subtraction)
                ) {
                    result += print(arg, oneToOne);
                } else if (Semantic.util.isSubtraction(arg)) {
                    if (
                        arg.arg.type === NodeType.Number ||
                        arg.arg.type === NodeType.Identifier ||
                        arg.arg.type === NodeType.Mul ||
                        arg.arg.type === NodeType.Div ||
                        arg.arg.type === NodeType.Power ||
                        (arg.arg.type === NodeType.Neg && !arg.arg.subtraction)
                    ) {
                        result += print(arg.arg, oneToOne);
                    } else {
                        result += `(${print(arg.arg, oneToOne)})`;
                    }
                } else {
                    result += `(${print(arg, oneToOne)})`;
                }
            }

            return result;
        }
        case NodeType.Mul: {
            let result = "";

            const wrapAll = expr.args.some((arg, index) => {
                if (arg.type === NodeType.Number && index > 0) {
                    return true;
                }
                if (arg.type === NodeType.Neg && (index > 0 || oneToOne)) {
                    return true;
                }
                if (arg.type === NodeType.Div) {
                    return true;
                }
                return false;
            });

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (!expr.implicit && i > 0) {
                    result += " * ";
                }

                const wrap =
                    (wrapAll && expr.implicit) ||
                    arg.type === NodeType.Add ||
                    (arg.type === NodeType.Mul && !arg.implicit) ||
                    (expr.implicit &&
                        arg.type === NodeType.Mul &&
                        arg.implicit);
                const node = print(arg, oneToOne);

                if (wrap) {
                    result += `(${node})`;
                } else {
                    result += node;
                }
            }

            return result;
        }
        case NodeType.Neg: {
            const node = print(expr.arg, oneToOne);
            if (
                expr.arg.type === NodeType.Number ||
                expr.arg.type === NodeType.Identifier ||
                (expr.arg.type === NodeType.Neg && !expr.arg.subtraction) ||
                (expr.arg.type === NodeType.Mul && expr.arg.implicit) ||
                expr.arg.type === NodeType.Power // pow has a higher precedence
            ) {
                return `-${node}`;
            } else {
                return `-(${node})`;
            }
        }
        case NodeType.Div: {
            const numerator =
                expr.args[0].type === NodeType.Add ||
                (expr.args[0].type === NodeType.Mul &&
                    !expr.args[0].implicit) ||
                expr.args[0].type === NodeType.Div
                    ? `(${print(expr.args[0], oneToOne)})`
                    : print(expr.args[0], oneToOne);
            const denominator =
                expr.args[1].type === NodeType.Add ||
                (expr.args[1].type === NodeType.Mul &&
                    !expr.args[1].implicit) ||
                expr.args[1].type === NodeType.Div
                    ? `(${print(expr.args[1], oneToOne)})`
                    : print(expr.args[1], oneToOne);

            // TODO: change the spacing depending on the parent.
            return `${numerator} / ${denominator}`;
        }
        case NodeType.Equals: {
            // TODO: add a check to make sure this is true
            const args = expr.args as TwoOrMore<Semantic.types.NumericNode>;
            return args.map((arg) => print(arg, oneToOne)).join(" = ");
        }
        case NodeType.Power: {
            const {base, exp} = expr;

            // 'number' nodes are never negative so this is okay
            if (
                base.type === NodeType.Identifier ||
                base.type === NodeType.Number
            ) {
                if (
                    exp.type === NodeType.Identifier ||
                    exp.type === NodeType.Number
                ) {
                    return `${print(base, oneToOne)}^${print(exp, oneToOne)}`;
                } else {
                    return `${print(base, oneToOne)}^(${print(exp, oneToOne)})`;
                }
            } else {
                if (
                    exp.type === NodeType.Identifier ||
                    exp.type === NodeType.Number
                ) {
                    return `(${print(base, oneToOne)})^${print(exp, oneToOne)}`;
                } else {
                    return `(${print(base, oneToOne)})^(${print(
                        exp,
                        oneToOne,
                    )})`;
                }
            }
        }
        case NodeType.Parens: {
            return `(${print(expr.arg)})`;
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};
