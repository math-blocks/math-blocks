import {UnreachableCaseError} from "@math-blocks/core";

import {TokenNode} from "./types";

const print = (
    val: unknown,
    serialize: (ast: TokenNode) => string,
    indent: (str: string) => string,
): string => {
    const ast = val as TokenNode;
    const {loc} = ast;
    switch (ast.type) {
        case "token": {
            switch (ast.name) {
                case "number":
                    return `(num@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end} ${ast.value})`;
                case "identifier":
                    return `(ident@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end} ${ast.value})`;
                default:
                    return `${ast.name}@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end}`;
            }
        }
        case "frac": {
            const [numerator, denominator] = ast.children;
            return `(frac@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${print(numerator, serialize, indent)} ${print(
                denominator,
                serialize,
                indent,
            )})`;
        }
        case "row": {
            return `(row ${ast.children
                .map((child) => "\n" + indent(print(child, serialize, indent)))
                .join(" ")})`;
        }
        case "subsup": {
            const [sub, sup] = ast.children;
            return `(subsup@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${sub ? print(sub, serialize, indent) : "^"} ${
                sup ? print(sup, serialize, indent) : "_"
            })`;
        }
        case "limits": {
            const inner = print(ast.inner, serialize, indent);
            const [lower, upper] = ast.children;
            return `(limits{${inner}}@[${loc.path.map(String).join(",")}]:${
                loc.start
            }:${loc.end} ${print(lower, serialize, indent)} ${
                upper ? print(upper, serialize, indent) : "_"
            })`;
        }
        case "root": {
            const [index, radicand] = ast.children;
            return `(root@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${print(radicand, serialize, indent)} ${
                index ? print(index, serialize, indent) : "_"
            })`;
        }
        case "delimited": {
            const inner = print(ast.children[0], serialize, indent);
            const open = print(ast.leftDelim, serialize, indent);
            const close = print(ast.rightDelim, serialize, indent);

            return `(delimited@[${loc.path.map(String).join(",")}]:${
                loc.start
            }:${loc.end} ${open} ${inner} ${close})`;
        }
        case "table": {
            const children = ast.children.map(
                (child) => child && print(child, serialize, indent),
            );
            return `(table@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${children.join(" ")})`;
        }
        default:
            throw new UnreachableCaseError(ast);
    }
};

export const serializer = {
    print: print,
    test: (ast: TokenNode): boolean => !!ast.type,
};
