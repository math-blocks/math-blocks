// @flow
import * as Semantic from "./semantic";
import {UnreachableCaseError} from "./util";

// TODO: determine when to wrap subexpressions in parens

// NOTE: This is mainly for debugging purposes
const print = (expr: Semantic.Expression): string => {
    switch (expr.kind) {
        case "number":
            return expr.value;
        case "identifier":
            return expr.name;

        // Arithmetic operations
        case "add":
            return expr.args.map(print).join(" + "); // TODO: handle args[i].kind === "neg" && args[i].subtraction
        case "mul":
            return expr.args.map(print).join(" * "); // TODO: handle implicit mulitplication
        case "div":
            return `${print(expr.dividend)} / ${print(expr.divisor)}`;
        case "mod":
            return `${print(expr.dividend)} mod ${print(expr.divisor)}`;
        case "neg":
            return expr.subtraction ? `${print(expr)}` : `-${print(expr)}`;
        case "root":
            return `√(${print(expr.radicand)})`; // TODO: index
        case "log":
            return `log_${print(expr.base)}(${print(expr.arg)})`;
        case "exp":
            return `${print(expr.base)}^${print(expr.exp)}`;
        case "abs":
            return `|${print(expr.arg)}|`;
        case "func":
            return `${print(expr.func)}(${expr.args.map(print).join(", ")})`;

        case "sum":
            return `Σ_(${print(expr.bvar)}=${print(expr.limits.lower)})^${print(
                expr.limits.upper,
            )} ${print(expr.arg)}`;
        case "prod":
            return `Π_(${print(expr.bvar)}=${print(expr.limits.lower)})^${print(
                expr.limits.upper,
            )} ${print(expr.arg)}`;
        case "limit":
            return `lim_(${print(expr.bvar)}→value) ${print(expr.arg)}`;
        case "diff": {
            const {arg, bvar} = expr;
            return bvar ? `d${print(arg)}/d${print(bvar)}` : `${print(arg)}'`; // TODO: handle expr.degree > 1
        }
        case "int":
            return `∫_(${print(expr.limits.lower)})^(${print(
                expr.limits.upper,
            )}) ${print(expr.arg)} ${print(expr.bvar)}`;

        case "ellipsis":
            return "⋯";
        case "infinity":
            return "∞";
        case "pi":
            return "π";

        // Numeric relations
        case "eq":
            return expr.args.map(print).join(" = ");
        case "neq":
            return expr.args.map(print).join(" ≠ ");
        case "lt":
            return expr.args.map(print).join(" < ");
        case "lte":
            return expr.args.map(print).join(" ≤ ");
        case "gt":
            return expr.args.map(print).join(" > ");
        case "gte":
            return expr.args.map(print).join(" ≥ ");

        // Logical operations
        case "and":
            return expr.args.map(print).join(" ∧ ");
        case "or":
            return expr.args.map(print).join(" ∨ ");
        case "xor":
            return expr.args.map(print).join(" ⊕ ");
        case "implies":
            return `${print(expr.args[0])} ⇒ ${print(expr.args[1])}`;
        case "iff":
            return `${print(expr.args[0])} ⇔ ${print(expr.args[1])}`;
        case "not":
            return "¬" + print(expr.arg);

        // Logical (Boolean) values
        case "true":
            return "T";
        case "false":
            return "F";

        // Sets
        case "set":
            return `{${expr.elements.map(print).join(", ")}}`;
        case "union":
            return expr.args.map(print).join(" ⋃ ");
        case "intersection":
            return expr.args.map(print).join(" ⋂ ");
        case "setdiff":
            return `${print(expr.args[0])} ∖ ${print(expr.args[1])}`;
        case "cartesianproduct":
            return expr.args.map(print).join(" × ");

        case "in":
            return `${print(expr.element)} ∈ ${print(expr.set)}`;
        case "notin":
            return `${print(expr.element)} ∉ ${print(expr.set)}`;
        case "subset":
            return expr.args.map(print).join(" ⊆ ");
        case "prsubset":
            return expr.args.map(print).join(" ⊂ ");
        case "notsubset":
            return expr.args.map(print).join(" ⊈ ");
        case "notprsubset":
            return expr.args.map(print).join(" ⊄ ");

        case "empty":
            return "∅";
        case "naturals":
            return "ℕ";
        case "integers":
            return "ℤ";
        case "rationals":
            return "ℚ";
        case "reals":
            return "ℝ";
        case "complexes":
            return "ℂ";

        default:
            throw new UnreachableCaseError(expr);
    }
};

export default print;
