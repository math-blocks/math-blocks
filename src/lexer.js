/**
 * @flow
 * Lexer - converts an editor node tree with glyph leaves to one with token leaves.
 *
 * Each glyph contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import * as Editor from "./editor";
import {UnreachableCaseError} from "./util";
import {getId} from "./unique-id";

// operations / relations: + - = < <= > >= != sqrt
// symbols: a - z, pi, theta, etc.
// functions: sin, cos, tan, log, lim, etc.

const funcs = ["sin", "cos", "tan", "log", "lim"];

type Identifier = {
    id: number,
    type: "identifier",
    name: string,
};

type Symbols = "+" | "\u2212" | "=" | "<" | ">";

const symbols: Symbols[] = ["+", "\u2212", "=", "<", ">"];

type Symbol = {
    id: number,
    type: "symbol",
    symbol: Symbols, // add more
};

type Number = {
    id: number,
    type: "number",
    value: string,
};

function identifier(name: string): Identifier {
    return {
        id: getId(),
        type: "identifier",
        name,
    };
}

function number(value: string): Number {
    return {
        id: getId(),
        type: "number",
        value,
    };
}

function symbol(symbol: Symbols): Symbol {
    return {
        id: getId(),
        type: "symbol",
        symbol,
    };
}

export type Token = Identifier | Symbol | Number;

type LexState = "new_token" | "integer" | "real" | "identifier";

const lexChildren = (
    nodes: Editor.Node<Editor.Glyph>[],
): Editor.Node<Token>[] => {
    const tokens: Editor.Node<Token>[] = [];

    let glyphs: Editor.Glyph[] = [];
    let state: LexState = "new_token";

    for (const node of nodes) {
        if (node.type === "glyph") {
            switch (state) {
                case "new_token": {
                    if (/[0-9]/.test(node.char)) {
                        state = "integer";
                    } else if (/[a-z]/.test(node.char)) {
                        state = "identifier";
                    } else if (symbols.includes(node.char)) {
                        tokens.push(symbol(((node.char: any): Symbols)));
                    } else {
                        throw new Error("unexpected glyph");
                    }
                    glyphs.push(node);
                    break;
                }
                case "integer": {
                    if (/[0-9]/.test(node.char)) {
                    } else if (node.char === ".") {
                        state = "real";
                    } else {
                        throw new Error("unexpected glyph");
                    }
                    glyphs.push(node);
                    break;
                }
                case "real": {
                    if (/[0-9]/.test(node.char)) {
                    } else if (node.char === ".") {
                        throw new Error(
                            "real number already contains a decimal",
                        );
                    } else {
                        throw new Error("unexpected glyph");
                    }
                    glyphs.push(node);
                    break;
                }
                case "identifier": {
                    if (/[a-z]/.test(node.char)) {
                        glyphs.push(node);
                        const name = glyphs.map(x => x.char).join("");
                        if (funcs.includes(name)) {
                            tokens.push(identifier(name));
                            state = "new_token";
                            glyphs = [];
                        }
                    } else {
                        throw new Error("unexpected glyph");
                    }
                    break;
                }
                default:
                    throw new UnreachableCaseError(state);
            }
        } else {
            // check whatever state we're currently in and complete processing for that state
            switch (state) {
                case "new_token": {
                    tokens.push(lex(node));
                    break;
                }
                case "integer":
                case "real": {
                    tokens.push(number(glyphs.map(x => x.char).join("")));
                    break;
                }
                case "identifier": {
                    const name = glyphs.map(x => x.char).join("");
                    if (funcs.includes(name)) {
                        tokens.push(identifier(name));
                    } else {
                        // identifier doesn't match any of the function names so split
                        // them into single character identifiers
                        tokens.push(...glyphs.map(x => identifier(x.char)));
                    }
                    break;
                }
                default:
                    throw new UnreachableCaseError(state);
            }

            state = "new_token"; // reset the state
            glyphs = [];
        }
    }

    // The last node might have been a glyph so make sure we flush the remaining glyphs
    switch (state) {
        case "new_token": {
            // We've already handled the last node
            break;
        }
        case "integer":
        case "real": {
            tokens.push(number(glyphs.map(x => x.char).join("")));
            break;
        }
        case "identifier": {
            const name = glyphs.map(x => x.char).join("");
            if (funcs.includes(name)) {
                tokens.push(identifier(name));
            } else {
                // identifier doesn't match any of the function names so split
                // them into single character identifiers
                tokens.push(...glyphs.map(x => identifier(x.char)));
            }
            break;
        }
        default:
            throw new UnreachableCaseError(state);
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
        case "glyph":
            return {
                id: node.id,
                type: "identifier",
                name: node.char,
            };
        default:
            throw new UnreachableCaseError(node);
    }
};
