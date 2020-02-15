import * as Editor from "@math-blocks/editor";
import {Node, SubSup, Frac, Row, Atom, Root} from "@math-blocks/editor";

import {Token} from "./editor-lexer";
import {Location} from "./editor-lexer";

export function row(
    children: Node<Token, {loc: Location}>[],
): Row<Token, {loc: Location}> {
    return {
        type: "row",
        children,
        loc: {path: [], start: -1, end: -1},
    };
}

export function subsup(
    sub: Node<Token, {loc: Location}>[] | void,
    sup: Node<Token, {loc: Location}>[] | void,
    loc: Location,
): SubSup<Token, {loc: Location}> {
    return {
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
        loc,
    };
}

export function frac(
    numerator: Node<Token, {loc: Location}>[],
    denominator: Node<Token, {loc: Location}>[],
    loc: Location,
): Frac<Token, {loc: Location}> {
    return {
        type: "frac",
        children: [row(numerator), row(denominator)],
        loc,
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
    arg: Node<Token, {loc: Location}>[],
    index: Node<Token, {loc: Location}>[] | null,
    loc: Location,
): Root<Token, {loc: Location}> {
    return {
        type: "root",
        children: [row(arg), index ? row(index) : null],
        loc,
    };
}

export function atom(
    value: Token,
    loc: Location,
): Atom<Token, {loc: Location}> {
    return {
        type: "atom",
        value,
        loc,
    };
}

const print = (
    ast: Editor.Node<Token, {loc: Location}>,
    serialize: (ast: Editor.Node<Token>) => string,
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
                .map(child => "\n" + indent(print(child, serialize, indent)))
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
    test: (ast: Editor.Node<Token>) => !!ast.type,
};
