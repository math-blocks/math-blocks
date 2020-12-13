/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from "@math-blocks/semantic";

// TODO: Use the operator precedence numbers from text-parser to determine when
// to add parens (or not).

export const print = (expr: Semantic.Types.Node): string => {
    switch (expr.type) {
        case "identifier": {
            // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
            // TODO: handle subscripts

            return expr.name;
        }
        case "number": {
            // How do we avoid creating a bunch of ids that we immediately
            // throw away because this number is part of a larger expression
            // and thus contained within a larger row?
            return expr.value;
        }
        case "add": {
            let result = "";

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (i > 0) {
                    if (Semantic.isSubtraction(arg)) {
                        result += " - ";
                    } else {
                        result += " + ";
                    }
                }

                if (
                    arg.type === "number" ||
                    arg.type === "identifier" ||
                    arg.type === "mul" ||
                    arg.type === "div" ||
                    arg.type === "pow" ||
                    (arg.type === "neg" && !arg.subtraction)
                ) {
                    result += print(arg);
                } else if (Semantic.isSubtraction(arg)) {
                    if (
                        arg.arg.type === "number" ||
                        arg.arg.type === "identifier" ||
                        arg.arg.type === "mul" ||
                        arg.arg.type === "div" ||
                        arg.arg.type === "pow" ||
                        (arg.arg.type === "neg" && !arg.arg.subtraction)
                    ) {
                        result += print(arg.arg);
                    } else {
                        result += `(${print(arg.arg)})`;
                    }
                } else {
                    result += `(${print(arg)})`;
                }
            }

            return result;
        }
        case "mul": {
            let result = "";

            const wrapAll = expr.args.some((arg, index) => {
                if (arg.type === "number" && index > 0) {
                    return true;
                }
                if (arg.type === "neg" && index > 0) {
                    return true;
                }
                if (arg.type === "div") {
                    return true;
                }
                return false;
            });

            for (let i = 0; i < expr.args.length; i++) {
                const arg = expr.args[i];
                if (!expr.implicit && i > 0) {
                    result += " * ";
                }

                // TODO: we probably also want to wrap things like (a * b)(x * y)
                const wrap = (wrapAll && expr.implicit) || arg.type === "add";
                const node = print(arg);

                if (wrap) {
                    result += `(${node})`;
                } else {
                    result += node;
                }
            }

            return result;
        }
        case "neg": {
            const node = print(expr.arg);
            if (
                expr.arg.type === "number" ||
                expr.arg.type === "identifier" ||
                expr.arg.type === "pow" // pow has a higher precedence
            ) {
                return `-${node}`;
            } else {
                return `-(${node})`;
            }
        }
        case "div": {
            const numerator =
                expr.args[0].type === "add" ||
                (expr.args[0].type === "mul" && !expr.args[0].implicit) ||
                expr.args[0].type === "div"
                    ? `(${print(expr.args[0])})`
                    : print(expr.args[0]);
            const denominator =
                expr.args[1].type === "add" ||
                (expr.args[1].type === "mul" && !expr.args[1].implicit) ||
                expr.args[1].type === "div"
                    ? `(${print(expr.args[1])})`
                    : print(expr.args[1]);

            // TODO: change the spacing depending on the parent.
            return `${numerator} / ${denominator}`;
        }
        case "eq": {
            return expr.args.map(print).join(" = ");
        }
        case "pow": {
            const {base, exp} = expr;

            // 'number' nodes are never negative so this is okay
            if (base.type === "identifier" || base.type === "number") {
                if (exp.type === "identifier" || exp.type === "number") {
                    return `${print(base)}^${print(exp)}`;
                } else {
                    return `${print(base)}^(${print(exp)})`;
                }
            } else {
                if (exp.type === "identifier" || exp.type === "number") {
                    return `(${print(base)})^${print(exp)}`;
                } else {
                    return `(${print(base)})^(${print(exp)})`;
                }
            }
        }
        default: {
            throw new Error(`print doesn't handle ${expr.type} nodes yet`);
        }
    }
};
