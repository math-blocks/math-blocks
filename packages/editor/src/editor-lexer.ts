/**
 * Lexer - converts an editor node tree with glyph leaves to one with token leaves.
 *
 * Each glyph contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import * as Editor from "./editor-ast";
import {Atom} from "./editor-ast";
import {UnreachableCaseError} from "@math-blocks/core";

type Location = {
    path: number[];
    start: number;
    end: number;
};

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

// const funcs = ["sin", "cos", "tan", "log", "lim"];

type Ident = {kind: "identifier"; name: string};
type Num = {kind: "number"; value: string};
type Plus = {kind: "plus"};
type Minus = {kind: "minus"};
type Times = {kind: "times"};
type Equal = {kind: "eq"};
type LParens = {kind: "lparens"};
type RParens = {kind: "rparens"};
type Ellipsis = {kind: "ellipsis"};
type EOL = {kind: "eol"};

const atom = (token: Token): Atom<Token, {}> => ({
    type: "atom",
    value: token,
});

export const identifier = (name: string): Atom<Token, {}> =>
    atom({kind: "identifier", name});

export const number = (value: string): Atom<Token, {}> => {
    if (isNaN(parseFloat(value))) {
        throw new Error(`${value} is not a number`);
    }
    return atom({kind: "number", value});
};

export const plus = (): Atom<Token, {}> => atom({kind: "plus"});
export const minus = (): Atom<Token, {}> => atom({kind: "minus"});
export const times = (): Atom<Token, {}> => atom({kind: "times"});
export const lparens = (): Atom<Token, {}> => atom({kind: "lparens"});
export const rparens = (): Atom<Token, {}> => atom({kind: "rparens"});
export const ellipsis = (): Atom<Token, {}> => atom({kind: "ellipsis"});
export const eq = (): Atom<Token, {}> => atom({kind: "eq"});

export type Token =
    | Ident
    | Num
    | Plus
    | Minus
    | Times
    | Equal
    | LParens
    | RParens
    | Ellipsis
    | EOL;

const TOKEN_REGEX = /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\+|\u2212|=|\(|\)|\.\.\.)|(sin|cos|tan|[a-z])/gi;

// TODO: include ids of source glyphs in parsed tokens

const processGlyphs = (glyphs: Editor.Glyph[]): Atom<Token, {}>[] => {
    const tokens: Atom<Token, {}>[] = [];
    if (glyphs.length > 0) {
        const str = glyphs.map(glyph => glyph.char).join("");
        const matches = str.matchAll(TOKEN_REGEX);

        for (const match of matches) {
            const [, value, sym, name] = match;
            if (value) {
                tokens.push(number(value));
            } else if (sym) {
                switch (sym) {
                    case "=":
                        tokens.push(eq());
                        break;
                    case "+":
                        tokens.push(plus());
                        break;
                    case "\u2212":
                        tokens.push(minus());
                        break;
                    case "...":
                        tokens.push(ellipsis());
                        break;
                    case "(":
                        tokens.push(lparens());
                        break;
                    case ")":
                        tokens.push(rparens());
                        break;
                    default:
                        throw new Error(`Unexpected symbol token: ${sym}`);
                }
            } else if (name) {
                tokens.push(identifier(name));
            }
            // TODO: check if there are leftover characters between token matches
        }
        // TODO: check if there are leftover characters after the last token match
        glyphs = [];
    }
    return tokens;
};

const lexChildren = (
    nodes: Editor.Node<Editor.Glyph, {id: number}>[],
): Editor.Node<Token, {}>[] => {
    const tokens: Editor.Node<Token, {}>[] = [];

    let glyphs: Editor.Glyph[] = [];

    for (const node of nodes) {
        if (node.type === "atom") {
            const {value} = node;
            glyphs.push(value);
        } else {
            tokens.push(...processGlyphs(glyphs));
            tokens.push(lex(node));
            glyphs = [];
        }
    }

    tokens.push(...processGlyphs(glyphs));

    return tokens;
};

const lexRow = (
    row: Editor.Row<Editor.Glyph, {id: number}>,
): Editor.Row<Token, {}> => {
    return {
        type: "row",
        children: lexChildren(row.children),
    };
};

export const lex = (
    node: Editor.Node<Editor.Glyph, {id: number}>,
): Editor.Node<Token, {}> => {
    switch (node.type) {
        case "row":
            return {
                type: "row",
                children: lexChildren(node.children),
            };
        case "subsup": {
            const [sub, sup] = node.children;
            return {
                type: "subsup",
                // TODO: use null-coalescing
                children: [sub ? lexRow(sub) : null, sup ? lexRow(sup) : null],
            };
        }
        case "frac":
            return {
                type: "frac",
                children: [lexRow(node.children[0]), lexRow(node.children[1])],
            };
        case "root": {
            const [radicand, index] = node.children;
            return {
                type: "root",
                children: [lexRow(radicand), index ? lexRow(index) : null],
            };
        }
        case "atom":
            throw new Error("lexChildren coalesces glyphs, use it instead");
        default:
            throw new UnreachableCaseError(node);
    }
};
