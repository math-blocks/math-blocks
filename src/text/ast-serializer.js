// @flow
import * as Semantic from "../semantic.js";

type Node = Semantic.Expression;

const print = (
    ast: Node,
    serialize: JestPrettyFormatPrint,
    indent: JestPrettyFormatIndent,
    // opts?: JestPrettyFormatOptions,
    // colors?: JestPrettyFormatColors,
): string => {
    if (ast.type === "number") {
        return `${ast.value}`;
    } else if (ast.type === "identifier") {
        return `${ast.name}`;
    } else {
        let type = ast.type;
        if (ast.type === "mul") {
            type = ast.implicit ? "mul.imp" : "mul.exp";
        }

        // $FlowFixMe: handle all non-args nodes
        const args: Node[] = ast.args;
        const hasGrandchildren = args.some((arg: Node) =>
            arg.hasOwnProperty("args"),
        );

        if (hasGrandchildren) {
            return `(${type}\n${args
                .map((arg: Node) => indent(print(arg, serialize, indent)))
                .join("\n")})`;
        } else {
            return `(${type} ${args
                .map((arg: Node) => print(arg, serialize, indent))
                .join(" ")})`;
        }
    }
};

const serializer = {
    print: print,
    test: (val: any) => !!val.type,
};

export default serializer;
