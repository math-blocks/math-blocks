/**
 * @flow
 * Lexer - converts an editor node tree with glyph leaves to one with token leaves.
 *
 * Each glyph contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import matchAll from "string.prototype.matchall";

import * as Editor from "./editor";
import {UnreachableCaseError} from "./util";
import {getId} from "./unique-id";

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

const funcs = ["sin", "cos", "tan", "log", "lim"];

type Identifier = {
    kind: "identifier",
    name: string,
};

type Symbols = "+" | "\u2212" | "=" | "<" | ">";

const symbols: Symbols[] = ["+", "\u2212", "=", "<", ">"];

type Symbol = {
    kind: "symbol",
    symbol: Symbols, // add more
};

type Number = {
    kind: "number",
    value: string,
};

export function identifier(name: string): Editor.Atom<Token> {
    return {
        id: getId(),
        type: "atom",
        value: {
            kind: "identifier",
            name,
        },
    };
}

export function number(value: string): Editor.Atom<Token> {
    return {
        id: getId(),
        type: "atom",
        value: {
            kind: "number",
            value,
        },
    };
}

export function symbol(symbol: Symbols): Editor.Atom<Token> {
    return {
        id: getId(),
        type: "atom",
        value: {
            kind: "symbol",
            symbol,
        },
    };
}

export type Token = Identifier | Symbol | Number;

const TOKEN_REGEX = /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\+|\-|\=)|(sin|cos|tan|[a-z])/gi;

type LexState = "new_token" | "integer" | "real" | "identifier";

// TODO: include ids of source glyphs in parsed tokens

const lexChildren = (
    nodes: Editor.Node<Editor.Glyph>[],
): Editor.Node<Token>[] => {
    const tokens: Editor.Node<Token>[] = [];

    // const matches = matchAll()

    let glyphs: Editor.Glyph[] = [];
    let state: LexState = "new_token";

    for (const node of nodes) {
        if (node.type === "atom") {
            const {value} = node;
            glyphs.push(value);
        } else {
            if (glyphs.length > 0) {
                const str = glyphs.map(glyph => glyph.char).join("");
                const matches = matchAll(str, TOKEN_REGEX);

                for (const match of matches) {
                    const [, value, sym, name] = match;
                    if (value) {
                        tokens.push(number(value));
                    } else if (sym) {
                        tokens.push(symbol(sym));
                    } else if (name) {
                        tokens.push(identifier(name));
                    }
                    // TODO: check if there are leftover characters between token matches
                }
                // TODO: check if there are leftover characters after the last token match
                glyphs = [];
            }

            tokens.push(lex(node));
        }
    }

    if (glyphs.length > 0) {
        const str = glyphs.map(glyph => glyph.char).join("");
        const matches = matchAll(str, TOKEN_REGEX);

        for (const match of matches) {
            const [, value, sym, name] = match;
            if (value) {
                tokens.push(number(value));
            } else if (sym) {
                tokens.push(symbol(sym));
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
        case "subsup":
            return {
                id: node.id,
                type: "subsup",
                // TODO: use null-coalescing
                sub: node.sub && lexRow(node.sub),
                sup: node.sup && lexRow(node.sup),
            };
        case "frac":
            return {
                id: node.id,
                type: "frac",
                numerator: lexRow(node.numerator),
                denominator: lexRow(node.denominator),
            };
        case "parens":
            return {
                id: node.id,
                type: "parens",
                children: node.children.map(lex),
            };
        // We should never read this case since lexChildren will coalesce glyphs
        // into tokens for us.
        case "atom":
            throw new Error("FooBar");
        default:
            throw new UnreachableCaseError(node);
    }
};
