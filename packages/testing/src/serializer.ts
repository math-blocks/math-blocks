// import {UnreachableCaseError} from "@math-blocks/core";
import * as Semantic from "@math-blocks/semantic";

const printArgs = (
    type: string,
    args: readonly Semantic.types.Node[],
    serialize: (ast: Semantic.types.Node) => string,
    indent: (str: string) => string,
): string => {
    const hasGrandchildren = args.some(
        (arg: Semantic.types.Node) =>
            arg.type !== "identifier" && arg.type !== "number",
    );

    if (hasGrandchildren) {
        return `(${type}\n${args
            .map((arg: Semantic.types.Node) =>
                indent(print(arg, serialize, indent)),
            )
            .join("\n")})`;
    } else {
        return `(${type} ${args
            .map((arg: Semantic.types.Node) => print(arg, serialize, indent))
            .join(" ")})`;
    }
};

const symbols = {
    infinity: "\u221e",
    pi: "\u03c0",
    ellipsis: "...", // TODO: replace with \u2026 or \u22ef
    true: "T",
    false: "F",
    naturals: "\u2115",
    integers: "\u2124",
    rationals: "\u221a",
    reals: "\u221d",
    complexes: "\u2102",
};

// TODO: figure out how to generate a serializer directly from the schema.
// Schema nodes can include additional metadata like which symbol to use for a
// node.
// TODO: capture serialize and indent in a closure so that we don't have
// pass them down to each call to `print`.
const print = (
    val: unknown,
    serialize: (ast: Semantic.types.Node) => string,
    indent: (str: string) => string,
): string => {
    const ast = val as Semantic.types.Node | undefined;
    if (ast === undefined) {
        return "null";
    }
    switch (ast.type) {
        case "number": {
            return `${ast.value}`;
        }
        case "identifier": {
            if (ast.subscript) {
                return `(ident ${ast.name} ${print(
                    ast.subscript,
                    serialize,
                    indent,
                )})`;
            } else {
                return `${ast.name}`;
            }
        }
        case "neg": {
            const type = ast.subtraction ? "neg.sub" : "neg";
            return `(${type} ${print(ast.arg, serialize, indent)})`;
        }
        case "not":
        case "abs":
        case "parens":
            return `(${ast.type} ${print(ast.arg, serialize, indent)})`;
        case "mul": {
            const type = ast.implicit ? "mul.imp" : "mul.exp";
            return printArgs(type, ast.args, serialize, indent);
        }
        case "add":
        case "div":
        case "mod":
        case "and":
        case "or":
        case "xor":
        case "implies":
        case "iff":
        case "eq":
        case "neq":
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "set":
        case "union":
        case "intersection":
        case "setdiff":
        case "cartesian_product":
        case "subset":
        case "prsubset":
        case "notsubset":
        case "notprsubset":
            return printArgs(ast.type, ast.args, serialize, indent);
        case "root": {
            const radicand = print(ast.radicand, serialize, indent);
            const index = print(ast.index, serialize, indent);
            return `(${ast.type} :radicand ${radicand} :index ${index})`;
        }
        case "pow": {
            const hasGrandchildren =
                (ast.base.type !== "identifier" &&
                    ast.base.type !== "number") ||
                (ast.exp.type !== "identifier" && ast.exp.type !== "number");
            const base = print(ast.base, serialize, indent);
            const exp = print(ast.exp, serialize, indent);
            return hasGrandchildren
                ? `(${ast.type}\n${indent(`:base ${base}`)}\n${indent(
                      `:exp ${exp}`,
                  )})`
                : `(${ast.type} :base ${base} :exp ${exp})`;
        }
        case "infinity":
        case "pi":
        case "ellipsis":
        case "true":
        case "false":
        case "naturals":
        case "integers":
        case "rationals":
        case "reals":
        case "complexes":
            return symbols[ast.type];
        case "vert-work": {
            const before = `(eq ${ast.before.left.map((term) =>
                print(term, serialize, indent),
            )} ${ast.before.right.map((term) =>
                print(term, serialize, indent),
            )})`;
            const actions = `(eq ${ast.actions.left.map((term) =>
                term ? print(term, serialize, indent) : "null",
            )} ${ast.actions.right.map((term) =>
                term ? print(term, serialize, indent) : "null",
            )})`;
            const after = `(eq ${ast.after.left.map((term) =>
                term ? print(term, serialize, indent) : "null",
            )} ${ast.after.right.map((term) =>
                term ? print(term, serialize, indent) : "null",
            )})`;
            return `(${ast.type}\n${indent(`:before ${before}`)}\n${indent(
                `:actions ${actions}`,
            )}\n${indent(`:after ${after}`)})`;
        }
        default: {
            // TODO: finish handle cases and the uncomment this line
            // throw new UnreachableCaseError(ast);
            throw new Error(
                `we don't handle serializing '${ast.type}' nodes yet`,
            );
        }
    }
};

export const serializer = {
    print: print,
    test: (ast: Semantic.types.Node): boolean => !!ast.type,
};
