import {TextLocation} from "./types";

type Common = {
    loc: TextLocation;
};

// TODO: share these with editor-lexer.js
type Ident = {type: "identifier"; name: string} & Common;
type Num = {type: "number"; value: string} & Common;
type Plus = {type: "plus"} & Common;
type Minus = {type: "minus"} & Common;
type Times = {type: "times"} & Common;
type Slash = {type: "slash"} & Common;
type Eq = {type: "eq"} & Common;
type Caret = {type: "caret"} & Common;
type Underscore = {type: "underscore"} & Common;
type LParen = {type: "lparen"} & Common;
type RParen = {type: "rparen"} & Common;
type Ellipsis = {type: "ellipsis"} & Common;
type EOL = {type: "eol"} & Common;

export type Token =
    | Ident
    | Num
    | Eq
    | Plus
    | Minus
    | Times
    | Slash
    | Caret
    | Underscore
    | LParen
    | RParen
    | Ellipsis
    | EOL;

const TOKEN_REGEX = /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(\+|-|\*|\/|=|\^|_|\(|\)|\.\.\.)|(sin|cos|tan|[a-z])/gi;

export const identifier = (name: string, loc: TextLocation): Token => ({
    type: "identifier",
    name,
    loc,
});
export const number = (value: string, loc: TextLocation): Token => ({
    type: "number",
    value,
    loc,
});

export const eq = (loc: TextLocation): Token => ({type: "eq", loc});
export const plus = (loc: TextLocation): Token => ({type: "plus", loc});
export const minus = (loc: TextLocation): Token => ({type: "minus", loc});
export const times = (loc: TextLocation): Token => ({type: "times", loc});
export const slash = (loc: TextLocation): Token => ({type: "slash", loc});
export const caret = (loc: TextLocation): Token => ({type: "caret", loc});
export const underscore = (loc: TextLocation): Token => ({
    type: "underscore",
    loc,
});
export const lparen = (loc: TextLocation): Token => ({type: "lparen", loc});
export const rparen = (loc: TextLocation): Token => ({type: "rparen", loc});
export const ellipsis = (loc: TextLocation): Token => ({type: "ellipsis", loc});

const stringToToken: {
    [key: string]: (loc: TextLocation) => Token;
} = {
    "=": eq,
    "+": plus,
    "-": minus,
    "*": times,
    "/": slash,
    "(": lparen,
    ")": rparen,
    "^": caret,
    _: underscore,
    "...": ellipsis,
};

export const lex = (str: string): Token[] => {
    const tokens: Token[] = [];

    const matches = str.matchAll(TOKEN_REGEX);

    for (const match of matches) {
        const [, value, sym, name] = match;
        const {index} = match;
        if (typeof index === "undefined") {
            throw new Error("match has no index property");
        }

        if (value) {
            const loc: TextLocation = {
                start: index,
                end: index + value.length,
            };
            tokens.push(number(value, loc));
        } else if (sym) {
            const loc: TextLocation = {
                start: index,
                end: index + sym.length,
            };
            if (sym in stringToToken) {
                tokens.push(stringToToken[sym](loc));
            } else {
                throw new Error(`Unexpected symbol token: ${sym}`);
            }
        } else if (name) {
            const loc: TextLocation = {
                start: index,
                end: index + name.length,
            };
            tokens.push(identifier(name, loc));
        }
        // TODO: check if there are leftover characters between token matches
    }

    return tokens;
};
