/**
 * Lexer - converts an editor node tree with glyph leaves to one with token leaves.
 *
 * Each glyph contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import {Node, Row, Atom, SourceLocation} from "./types";

export const location = (
    path: number[],
    start: number,
    end: number,
): SourceLocation => ({
    path,
    start,
    end,
});

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

// const funcs = ["sin", "cos", "tan", "log", "lim"];

type Ident = {kind: "identifier"; name: string};
type Num = {kind: "number"; value: string};
type Plus = {kind: "plus"};
type Minus = {kind: "minus"};
type PlusMinus = {kind: "plusminus"};
type Times = {kind: "times"};
type Equal = {kind: "eq"};
type LParens = {kind: "lparens"};
type RParens = {kind: "rparens"};
type Ellipsis = {kind: "ellipsis"};
type Sum = {kind: "sum"};
type Prod = {kind: "prod"};
type Lim = {kind: "lim"};
type EOL = {kind: "eol"};

export const atom = (token: Token, loc: SourceLocation): Atom => ({
    type: "atom",
    value: token,
    loc,
});

export const identifier = (name: string, loc: SourceLocation): Atom =>
    atom({kind: "identifier", name}, loc);

export const number = (value: string, loc: SourceLocation): Atom => {
    if (isNaN(parseFloat(value))) {
        throw new Error(`${value} is not a number`);
    }
    return atom({kind: "number", value}, loc);
};

export const plus = (loc: SourceLocation): Atom => atom({kind: "plus"}, loc);

export const minus = (loc: SourceLocation): Atom => atom({kind: "minus"}, loc);

export const plusminus = (loc: SourceLocation): Atom =>
    atom({kind: "plusminus"}, loc);

export const times = (loc: SourceLocation): Atom => atom({kind: "times"}, loc);

export const lparens = (loc: SourceLocation): Atom =>
    atom({kind: "lparens"}, loc);

export const rparens = (loc: SourceLocation): Atom =>
    atom({kind: "rparens"}, loc);

export const ellipsis = (loc: SourceLocation): Atom =>
    atom({kind: "ellipsis"}, loc);

export const eq = (loc: SourceLocation): Atom => atom({kind: "eq"}, loc);

export type Token =
    | Ident
    | Num
    | Plus
    | Minus
    | PlusMinus
    | Times
    | Equal
    | LParens
    | RParens
    | Ellipsis
    | Sum
    | Prod
    | Lim
    | EOL;

const TOKEN_REGEX = /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\*|\u00B7|\u00B1|\+|\u2212|=|\(|\)|\.\.\.)|(sin|cos|tan|[a-z])/gi;

// TODO: include ids of source glyphs in parsed tokens

const processGlyphs = (
    glyphs: types.Glyph[],
    path: number[],
    offset: number,
): readonly Atom[] => {
    const tokens: Atom[] = [];
    if (glyphs.length > 0) {
        const str = glyphs.map((glyph) => glyph.char).join("");
        const matches = str.matchAll(TOKEN_REGEX);

        for (const match of matches) {
            const [, value, sym, name] = match;
            const {index} = match;
            if (typeof index !== "number") {
                // Should we throw if there's match?
                continue;
            }
            if (value) {
                const loc = location(
                    path,
                    offset + index,
                    offset + index + value.length,
                );
                tokens.push(number(value, loc));
            } else if (sym) {
                const loc = location(
                    path,
                    offset + index,
                    offset + index + sym.length,
                );
                switch (sym) {
                    case "=":
                        tokens.push(eq(loc));
                        break;
                    case "+":
                        tokens.push(plus(loc));
                        break;
                    case "*":
                        tokens.push(times(loc));
                        break;
                    case "\u00B7":
                        tokens.push(times(loc));
                        break;
                    case "\u2212":
                        tokens.push(minus(loc));
                        break;
                    case "\u00B1":
                        tokens.push(plusminus(loc));
                        break;
                    case "...":
                        tokens.push(ellipsis(loc));
                        break;
                    case "(":
                        tokens.push(lparens(loc));
                        break;
                    case ")":
                        tokens.push(rparens(loc));
                        break;
                    default:
                        throw new Error(`Unexpected symbol token: ${sym}`);
                }
            } else if (name) {
                const loc = location(
                    path,
                    offset + index,
                    offset + index + name.length,
                );
                tokens.push(identifier(name, loc));
            }
            // TODO: check if there are leftover characters between token matches
        }
        // TODO: check if there are leftover characters after the last token match
        glyphs = [];
    }

    return tokens;
};

const lexChildren = (nodes: readonly types.Node[], path: number[]): Node[] => {
    // TODO: assert that nodes.length > 0

    const tokens: Node[] = [];

    let glyphs: types.Glyph[] = [];

    nodes.forEach((node, index) => {
        if (node.type === "atom") {
            const {value} = node;
            glyphs.push(value);
        } else {
            const offset = index - glyphs.length;
            tokens.push(...processGlyphs(glyphs, path, offset));
            tokens.push(lex(node, path, index));
            glyphs = [];
        }
    });

    const offset = nodes.length - glyphs.length;
    tokens.push(...processGlyphs(glyphs, path, offset));

    return tokens;
};

function assertOneOrMore<T>(
    array: readonly T[],
    msg: string,
): asserts array is OneOrMore<T> {
    if (array.length === 0) {
        throw new Error(msg);
    }
}

export const lexRow = (row: types.Row, path: number[] = []): Row => {
    assertOneOrMore(row.children, "rows cannot be empty");
    return {
        type: "row",
        children: lexChildren(row.children, path),
        loc: location(path, 0, row.children.length),
    };
};

const lex = (node: types.Node, path: number[], offset: number): Node => {
    switch (node.type) {
        case "row":
            // This never gets called because rows must be children of
            // either: subsup, frac, or root.
            assertOneOrMore(node.children, "rows cannot be empty");
            return {
                type: "row",
                children: lexChildren(node.children, path),
                loc: location(path, offset, offset + 1),
            };
        case "subsup": {
            const [sub, sup] = node.children;
            return {
                type: "subsup",
                // TODO: use null-coalescing
                children: [
                    sub ? lexRow(sub, [...path, offset, 0]) : null,
                    sup ? lexRow(sup, [...path, offset, 1]) : null,
                ],
                loc: location(path, offset, offset + 1),
            };
        }
        case "limits": {
            const [lower, upper] = node.children;
            const loc = location(path, offset, offset + 1);

            let inner: Node;
            if (
                node.inner.type === "atom" &&
                node.inner.value.char === "\u03a3"
            ) {
                inner = atom({kind: "sum"}, loc);
            } else if (
                node.inner.type === "atom" &&
                node.inner.value.char === "\u03a0"
            ) {
                inner = atom({kind: "prod"}, loc);
            } else if (node.inner.type === "row") {
                // TODO: check that the row corresponds to "lim"
                inner = atom({kind: "lim"}, loc);
            } else {
                throw new Error("Invalid inner for limits");
            }

            return {
                type: "limits",
                children: [
                    lexRow(lower, [...path, offset, 0]),
                    upper ? lexRow(upper, [...path, offset, 1]) : null,
                ],
                inner,
                loc,
            };
        }
        case "frac": {
            const [numerator, denominator] = node.children;
            return {
                type: "frac",
                children: [
                    lexRow(numerator, [...path, offset, 0]),
                    lexRow(denominator, [...path, offset, 1]),
                ],
                loc: location(path, offset, offset + 1),
            };
        }
        case "root": {
            const [index, radicand] = node.children;
            return {
                type: "root",
                children: [
                    index ? lexRow(index, [...path, offset, 1]) : null,
                    lexRow(radicand, [...path, offset, 0]),
                ],
                loc: location(path, offset, offset + 1),
            };
        }
        case "delimited": {
            const leftDelim = lparens(location(path, offset, offset));
            const rightDelim = rparens(location(path, offset, offset));
            return {
                type: "delimited",
                children: [lexRow(node.children[0])],
                leftDelim: leftDelim,
                rightDelim: rightDelim,
                loc: location(path, offset, offset + 1),
            };
        }
        case "atom":
            throw new Error("lexChildren coalesces glyphs, use it instead");
        default:
            throw new UnreachableCaseError(node);
    }
};
