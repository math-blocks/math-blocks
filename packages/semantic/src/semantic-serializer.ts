import * as Semantic from "./semantic";

type Node = Semantic.Expression<undefined>;

const print = (
    ast: Node,
    serialize: (ast: Node) => string,
    indent: (str: string) => string,
): string => {
    if (ast.type === "number") {
        return `${ast.value}`;
    } else if (ast.type === "identifier") {
        if (ast.subscript) {
            return `(ident ${ast.name} ${print(
                ast.subscript,
                serialize,
                indent,
            )})`;
        } else {
            return `${ast.name}`;
        }
    } else {
        let type = ast.type as string;
        if (ast.type === "mul") {
            type = ast.implicit ? "mul.imp" : "mul.exp";
        }
        if (ast.type === "neg") {
            type = ast.subtraction ? "neg.sub" : "neg";
            return `(${type} ${print(ast.arg, serialize, indent)})`;
        }
        if (ast.type === "root") {
            const radicand = print(ast.radicand, serialize, indent);
            const index = print(ast.index, serialize, indent);
            return `(${ast.type} :radicand ${radicand} :index ${index})`;
        }
        if (ast.type === "exp") {
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
        if (ast.type === "ellipsis") {
            return "...";
        }

        // @ts-ignore
        const args: Node[] = ast.args;
        const hasGrandchildren = args.some(
            (arg: Node) => arg.type !== "identifier" && arg.type !== "number",
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
    test: (ast: Node) => !!ast.type,
};

export default serializer;
