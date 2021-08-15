import {locFromRange} from "./util";
import {
    Token,
    TokenNode,
    TokenRow,
    TokenSubSup,
    TokenFrac,
    TokenRoot,
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
): TokenSubSup {
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
): TokenFrac {
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
): TokenRoot {
    return {
        type: "root",
        children: [index ? row(index) : null, row(radicand)],
        loc,
    };
}

export function atom(token: Token, loc: SourceLocation): TokenAtom {
    return {
        ...token,
        loc,
    };
}
