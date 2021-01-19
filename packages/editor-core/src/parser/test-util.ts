import {Token} from "./lexer";
import {locFromRange} from "./util";
import {Node, Row, SubSup, Frac, Root, Atom, Location} from "./types";

export function row(children: OneOrMore<Node>): Row {
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
    sub: OneOrMore<Node> | void,
    sup: OneOrMore<Node> | void,
    loc: Location,
): SubSup {
    return {
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
        loc,
    };
}

export function frac(
    numerator: OneOrMore<Node>,
    denominator: OneOrMore<Node>,
    loc: Location,
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
    arg: OneOrMore<Node>,
    index: OneOrMore<Node> | null,
    loc: Location,
): Root {
    return {
        type: "root",
        children: [row(arg), index ? row(index) : null],
        loc,
    };
}

export function atom(value: Token, loc: Location): Atom {
    return {
        type: "atom",
        value,
        loc,
    };
}

const print = (
    ast: Node,
    serialize: (ast: Node) => string,
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
            const [radicand, index] = ast.children;
            return `(root@[${loc.path.map(String).join(",")}]:${loc.start}:${
                loc.end
            } ${atom.name} ${print(radicand, serialize, indent)} ${
                index ? print(index, serialize, indent) : "_"
            })`;
        }
    }
};

export const serializer = {
    print: print,
    test: (ast: Node): boolean => !!ast.type,
};