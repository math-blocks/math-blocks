import * as Semantic from "../semantic";

type Node = Semantic.Expression;

const print = (
    ast: Node,
    // @ts-ignore
    serialize: JestPrettyFormatPrint,
    // @ts-ignore
    indent: JestPrettyFormatIndent,
    // opts?: JestPrettyFormatOptions,
    // colors?: JestPrettyFormatColors,
): string => {
    if (ast.type === "number") {
        return `${ast.value}`;
    } else if (ast.type === "identifier") {
        return `${ast.name}`;
    } else {
        let type = ast.type as string;
        if (ast.type === "mul") {
            type = ast.implicit ? "mul.imp" : "mul.exp";
        }
        if (ast.type === "neg") {
            type = ast.subtraction ? "neg.sub" : "neg";
        }

        // @ts-ignore
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
