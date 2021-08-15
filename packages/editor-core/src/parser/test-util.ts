import {UnreachableCaseError} from "@math-blocks/core";

import {Token} from "./lexer";
import {locFromRange} from "./util";
import {
    TokenNode,
    TokenRow,
    SubSup,
    Frac,
    Root,
    TokenAtom,
    SourceLocation,
} from "./types";

export function row(children: readonly TokenNode[]): TokenRow {
    // What should the location be for an empty row?
    const loc =
        children.length > 0
            ? locFromRange(children[0].loc, children[children.length - 1].loc)
            : undefined;

    return {
        type: "row",
        children,
        // TODO: fix the path
        loc: loc || {path: [], start: -1, end: -1},
    };
}

export function subsup(
    sub: readonly TokenNode[] | void,
    sup: readonly TokenNode[] | void,
    loc: SourceLocation,
): SubSup {
    return {
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
        loc,
    };
}

export function frac(
    numerator: readonly TokenNode[],
    denominator: readonly TokenNode[],
    loc: SourceLocation,
): Frac {
    return {
        type: "frac",
        children: [row(numerator), row(denominator)],
        loc,
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
    radicand: readonly TokenNode[],
    index: readonly TokenNode[] | null,
    loc: SourceLocation,
): Root {
    return {
        type: "root",
        children: [index ? row(index) : null, row(radicand)],
        loc,
    };
}

export function atom(value: Token, loc: SourceLocation): TokenAtom {
    return {
        type: "atom",
        value,
        loc,
    };
}

const print = (
    ast: TokenNode,
    serialize: (ast: TokenNode) => string,
    indent: (str: string) => string,
): string => {
    const {loc} = ast;
    switch (ast.type) {
        case "atom": {
            const atom = ast.value;
            switch (atom.kind) {
                case "number":
                    return `(num@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end} ${atom.value})`;
                case "identifier":
                    return `(ident@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end} ${atom.name})`;
                default:
                    return `${atom.kind}@[${loc.path.map(String).join(",")}]:${
                        loc.start
                    }:${loc.end}`;
            }
        }
        case "frac": {
            const [numerator, denominator] = ast.children;
            return `(frac@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${atom.name} ${print(numerator, serialize, indent)} ${print(
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
            } ${atom.name} ${sub ? print(sub, serialize, indent) : "_"} ${
                sup ? print(sup, serialize, indent) : "_"
            })`;
        }
        case "limits": {
            const inner = print(ast.inner, serialize, indent);
            const [lower, upper] = ast.children;
            return `(limits{${inner}}@[${loc.path.map(String).join(",")}]:${
                loc.start
            }:${loc.end} ${atom.name} ${print(lower, serialize, indent)} ${
                upper ? print(upper, serialize, indent) : "_"
            })`;
        }
        case "root": {
            const [index, radicand] = ast.children;
            return `(root@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${atom.name} ${print(radicand, serialize, indent)} ${
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
