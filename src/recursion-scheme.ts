import { UnreachableCaseError } from './util';

type ReplaceType<T, Search, Replace> = {
    [P in keyof T]: T[P] extends Search 
        ? Replace 
        : T[P] extends Search[]
            ? Replace[]
            : T[P];
};

type Expr = {
    kind: "add",
    args: Expr[],
} | {
    kind: "mul",
    args: Expr[],
} | {
    kind: "number",
    value: string,
};

type ExprF<T> = ReplaceType<Expr, Expr, T>;

const fmap = <A, B>(
    fn: (a: A) => B,
    expr: ExprF<A>,
): ExprF<B> => {
    switch (expr.kind) {
        case "number":
            return expr;
        case "add":
            return {
                ...expr,
                args: expr.args.map(fn),
            };
        case "mul":
            return {
                ...expr,
                args: expr.args.map(fn),
            };
        default:
            throw new UnreachableCaseError(expr);
    }
}

const exprCata = <A, B, C = ExprF<B>>(
    fmap: (fn: (a: A) => B, expr: A) => C,
    transform: (exprA: C) => B, 
    expr: A,
): B => {
    return transform(fmap(x => exprCata(fmap, transform, x), expr));
}

const add = (a: number, b: number) => a + b;
const mul = (a: number, b: number) => a * b;
const zero = 0;
const one = 1;
const sum = (nums: number[]) => nums.reduce(add, zero);
const prod = (nums: number[]) => nums.reduce(mul, one);

type ExtractFromUnion<A, Disc extends string, Value> = A extends { [key in Disc]: Value } ? A : never;
type KindToMapFnMap = {
    [K in ExprF<number>["kind"]]: (expr: ExtractFromUnion<ExprF<number>, "kind", K>) => number;
};

const kindToMapFnMap: KindToMapFnMap = {
    add: x => sum(x.args),
    mul: x => prod(x.args),
    number: x => parseFloat(x.value),
};

const evaluateTransform = (expr: ExprF<number>): number => {
    switch (expr.kind) {
        case "number":
            return parseFloat(expr.value);
        case "add":
            return sum(expr.args);
        case "mul":
            return prod(expr.args);
        default:
            throw new UnreachableCaseError(expr);
    }

    // Unfortunately the following doesn't work:
    //  return kindToMapFnMap[expr.kind](expr);
};

const evaluate = (ast: Expr) => exprCata(fmap, evaluateTransform, ast);

const printTransform = (expr: ExprF<string>): string => {
    switch (expr.kind) {
        case "number":
            return expr.value;
        case "add":
            return `(${expr.args.join(" + ")})`;
        case "mul":
            return `(${expr.args.join(" * ")})`;
        default:
            throw new UnreachableCaseError(expr);
    }
};

const print = (ast: Expr) => exprCata(fmap, printTransform, ast);

const expr: Expr = {
    kind: "add",
    args: [
        {
            kind: "mul",
            args: [
                {kind: "number", value: "2"},
                {kind: "number", value: "3"},
            ],
        },
        {kind: "number", value: "1"},
    ],
};

console.log(`${print(expr)} = ${evaluate(expr)}`);
