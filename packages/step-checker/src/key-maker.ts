import * as Semantic from "@math-blocks/semantic";

type Node = Semantic.Expression;

const print = (ast: Node): string => {
    if (ast.type === "number") {
        return `${ast.value}`;
    } else if (ast.type === "identifier") {
        if (ast.subscript) {
            return `(ident#${ast.id} ${ast.name} ${print(ast.subscript)})`;
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
            return `(${type}#${ast.id} ${print(ast.arg)})`;
        }
        if (ast.type === "root") {
            const radicand = print(ast.radicand);
            const index = print(ast.index);
            return `(${ast.type}#${ast.id} :radicand ${radicand} :index ${index})`;
        }
        if (ast.type === "exp") {
            const base = print(ast.base);
            const exp = print(ast.exp);
            return `(${ast.type}#${ast.id} :base ${base} :exp ${exp})`;
        }
        if (ast.type === "ellipsis") {
            return "...";
        }

        const args: Node[] = ast.args;

        return `(${type}#${ast.id} ${args
            .map((arg: Node) => print(arg))
            .join(" ")})`;
    }
};

export const makeKey = (prev: Node, next: Node): string =>
    `${print(prev)}:${print(next)}`;
