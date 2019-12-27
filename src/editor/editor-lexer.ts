/**
 * Lexer - converts an editor node tree with glyph leaves to one with token leaves.
 *
 * Each glyph contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import * as Editor from "./editor";
import {UnreachableCaseError} from "../util";

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

// const funcs = ["sin", "cos", "tan", "log", "lim"];

type Ident = {readonly kind: "identifier"; readonly name: string};
type Num = {readonly kind: "number"; readonly value: string};
type Plus = {readonly kind: "plus"};
type Minus = {readonly kind: "minus"};
type Times = {readonly kind: "times"};
type Equal = {readonly kind: "eq"};
type Ellipsis = {readonly kind: "ellipsis"};
type EOL = {readonly kind: "eol"};

export const identifier = (name: string): Editor.Atom<Token> =>
    Editor.atom({kind: "identifier", name});
export const number = (value: string): Editor.Atom<Token> =>
    Editor.atom({kind: "number", value});
export const plus = (): Editor.Atom<Token> =>
    Editor.atom<Token>({kind: "plus"});
export const minus = (): Editor.Atom<Token> =>
    Editor.atom<Token>({kind: "minus"});
export const times = (): Editor.Atom<Token> =>
    Editor.atom<Token>({kind: "times"});
export const ellipsis = (): Editor.Atom<Token> =>
    Editor.atom<Token>({kind: "ellipsis"});
export const eq = (): Editor.Atom<Token> => Editor.atom<Token>({kind: "eq"});

export type Token = Ident | Num | Plus | Minus | Times | Equal | Ellipsis | EOL;

const TOKEN_REGEX = /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\+|\u2212|=|\.\.\.)|(sin|cos|tan|[a-z])/gi;

// TODO: include ids of source glyphs in parsed tokens

const processGlyphs = (glyphs: Editor.Glyph[]): Editor.Atom<Token>[] => {
    const tokens: Editor.Atom<Token>[] = [];
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
    nodes: readonly Editor.Node<Editor.Glyph>[],
): Editor.Node<Token>[] => {
    const tokens: Editor.Node<Token>[] = [];

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

const lexRow = (row: Editor.Row<Editor.Glyph>): Editor.Row<Token> => {
    return {
        id: row.id,
        type: "row",
        children: lexChildren(row.children),
    };
};

export const lex = (node: Editor.Node<Editor.Glyph>): Editor.Node<Token> => {
    switch (node.type) {
        case "row":
            return {
                id: node.id,
                type: "row",
                children: lexChildren(node.children),
            };
        case "subsup": {
            const [sub, sup] = node.children;
            return {
                id: node.id,
                type: "subsup",
                // TODO: use null-coalescing
                children: [sub ? lexRow(sub) : null, sup ? lexRow(sup) : null],
            };
        }
        case "frac":
            return {
                id: node.id,
                type: "frac",
                children: [lexRow(node.children[0]), lexRow(node.children[1])],
            };
        case "parens":
            return {
                id: node.id,
                type: "parens",
                children: lexChildren(node.children),
            };
        case "root": {
            const [radicand, index] = node.children;
            return {
                id: node.id,
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
