import {ValidationTypes} from "@math-blocks/semantic";
import {UnreachableCaseError} from "@math-blocks/core";

type VarDict = {
    [key: string]: number;
};

const add = (a: number, b: number): number => a + b;
const mul = (a: number, b: number): number => a * b;
const zero = 0;
const one = 1;
const sum = (args: number[]): number => args.reduce(add, zero);
const prod = (args: number[]): number => args.reduce(mul, one);
const div = (num: number, den: number): number => num / den;

const evaluate = (
    expr: ValidationTypes.Expression,
    varDict: VarDict,
): number => {
    switch (expr.type) {
        case "number":
            return parseFloat(expr.value);
        case "identifier": {
            const value = varDict[expr.name];
            if (value !== undefined) {
                return value;
            } else {
                throw new Error(`${expr.name} is not defined`);
            }
        }
        case "add": {
            const {args} = expr;
            return sum(args.map((arg) => evaluate(arg, varDict)));
        }
        case "mul":
            return prod(expr.args.map((arg) => evaluate(arg, varDict)));
        case "div": {
            const [dividend, divisor] = expr.args;
            return div(evaluate(dividend, varDict), evaluate(divisor, varDict));
        }
        case "mod": {
            const [dividend, divisor] = expr.args;
            return evaluate(dividend, varDict) % evaluate(divisor, varDict);
        }
        case "exp": {
            const {base, exp} = expr;
            return Math.pow(evaluate(base, varDict), evaluate(exp, varDict));
        }
        case "neg":
            return -evaluate(expr.arg, varDict);
        case "abs":
            return Math.abs(evaluate(expr.arg, varDict));
        case "root": {
            const {radicand, index} = expr;
            return Math.pow(
                evaluate(radicand, varDict),
                1 / evaluate(index, varDict),
            );
        }
        case "log": {
            const {base, arg} = expr;
            return (
                Math.log(evaluate(arg, varDict)) /
                Math.log(evaluate(base, varDict))
            );
        }

        case "infinity":
            return Infinity;
        case "pi":
            return Math.PI;

        // We can't evaluate these nodes
        case "ellipsis":
            throw new Error("can't evaluate ellipsis nodes");
        case "sum":
            throw new Error("can't evaluate sum nodes");
        case "prod":
            throw new Error("can't evaluate prod nodes");
        case "lim":
            throw new Error("can't evaluate limit nodes");
        case "diff":
            throw new Error("can't evaluate diff nodes");
        case "int":
            throw new Error("can't evaluate int nodes");
        case "func":
            throw new Error("can't evaluate func nodes");

        default:
            // @ts-ignore
            throw new UnreachableCaseError(expr);
    }
};

export default evaluate;
