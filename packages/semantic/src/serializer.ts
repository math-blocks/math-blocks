// import {UnreachableCaseError} from "@math-blocks/core";

import * as Types from "./types";

const printArgs = (
    type: string,
    args: readonly Types.Node[],
    serialize: (ast: Types.Node) => string,
    indent: (str: string) => string,
): string => {
    const hasGrandchildren = args.some(
        (arg: Types.Node) => arg.type !== "identifier" && arg.type !== "number",
    );

    if (hasGrandchildren) {
        return `(${type}\n${args
            .map((arg: Types.Node) => indent(print(arg, serialize, indent)))
            .join("\n")})`;
    } else {
        return `(${type} ${args
            .map((arg: Types.Node) => print(arg, serialize, indent))
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
const print = (
    ast: Types.Node,
    serialize: (ast: Types.Node) => string,
    indent: (str: string) => string,
): string => {
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
        default: {
            // TODO: finish handle cases and the uncomment this line
            // throw new UnreachableCaseError(ast);
            throw new Error(
                `we don't handle serializing '${ast.type}' nodes yet`,
            );
        }
    }
};

const serializer = {
    print: print,
    test: (ast: Types.Node): boolean => !!ast.type,
};

export default serializer;
