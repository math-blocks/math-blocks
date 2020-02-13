import {Node, SubSup, Frac, Row, Atom, Root} from "@math-blocks/editor";

import {Token} from "./editor-lexer";

type Location = {
    path: [];
    start: number;
    end: number;
};

type Loc = {};

export function row(children: Node<Token, Loc>[]): Row<Token, Loc> {
    return {
        type: "row",
        children,
    };
}

export function subsup(
    sub?: Node<Token, Loc>[],
    sup?: Node<Token, Loc>[],
): SubSup<Token, Loc> {
    return {
        type: "subsup",
        children: [sub ? row(sub) : null, sup ? row(sup) : null],
    };
}

export function frac(
    numerator: Node<Token, Loc>[],
    denominator: Node<Token, Loc>[],
): Frac<Token, Loc> {
    return {
        type: "frac",
        children: [row(numerator), row(denominator)],
    };
}

// It would be nice if we could provide defaults to parameterized functions
// We'd need type-classes for that but thye don't exist in JavaScript.
export function root(
    arg: Node<Token, Loc>[],
    index: Node<Token, Loc>[] | null,
): Root<Token, Loc> {
    return {
        type: "root",
        children: [row(arg), index ? row(index) : null],
    };
}

export function atom(value: Token): Atom<Token, Loc> {
    return {
        type: "atom",
        value,
    };
}
