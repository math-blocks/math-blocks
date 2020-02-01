import * as Editor from "./editor-ast";
import {Token} from "./editor-lexer";

type Node = Editor.Node<Token>;

const print = (
    ast: Node,
    serialize: (ast: Node) => string,
    indent: (str: string) => string,
): string => {
    switch (ast.type) {
        case "atom": {
            const atom = ast.value;
            switch (atom.kind) {
                case "number":
                    return `(num ${atom.value})`;
                case "identifier":
                    return `(ident ${atom.name})`;
                default:
                    return atom.kind;
            }
        }
        case "frac": {
            const [numerator, denominator] = ast.children;
            return `(frac ${print(numerator, serialize, indent)} ${print(
                denominator,
                serialize,
                indent,
            )})`;
        }
        case "row": {
            return `(row ${ast.children
                .map(child => print(child, serialize, indent))
                .join(" ")})`;
        }
        case "subsup": {
            const [sub, sup] = ast.children;
            return `(frac ${sub ? print(sub, serialize, indent) : "_"} ${
                sup ? print(sup, serialize, indent) : "_"
            })`;
        }
        case "root": {
            const [radicand, index] = ast.children;
            return `(frac ${print(radicand, serialize, indent)} ${
                index ? print(index, serialize, indent) : "_"
            })`;
        }
    }
};

const serializer = {
    print: print,
    test: (ast: Node) => !!ast.type,
};

export default serializer;
