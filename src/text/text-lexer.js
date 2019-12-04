// @flow
import matchAll from "string.prototype.matchall";

// TODO: share these with editor-lexer.js
type Identifier = {type: "identifier", name: string};
type Number = {type: "number", value: string};
type Plus = {type: "plus"};
type Minus = {type: "minus"};
type Times = {type: "times"};
type Slash = {type: "slash"};
type Eq = {type: "eq"};
type Caret = {type: "caret"};
type Underscore = {type: "underscore"};
type LParen = {type: "lparen"};
type RParen = {type: "rparen"};
type Ellipsis = {type: "ellipsis"};
type EOL = {type: "eol"};

export type Token =
    | Identifier
    | Number
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

export const identifier = (name: string): Token => ({type: "identifier", name});
export const number = (value: string): Token => ({type: "number", value});

export const eq = (): Token => ({type: "eq"});
export const plus = (): Token => ({type: "plus"});
export const minus = (): Token => ({type: "minus"});
export const times = (): Token => ({type: "times"});
export const slash = (): Token => ({type: "slash"});
export const caret = (): Token => ({type: "caret"});
export const underscore = (): Token => ({type: "underscore"});
export const lparen = (): Token => ({type: "lparen"});
export const rparen = (): Token => ({type: "rparen"});
export const ellipsis = (): Token => ({type: "ellipsis"});

const stringToToken: {[string]: () => Token, ...} = {
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

    const matches = matchAll(str, TOKEN_REGEX);

    for (const match of matches) {
        const [, value, sym, name] = match;
        if (value) {
            tokens.push(number(value));
        } else if (sym) {
            if (sym in stringToToken) {
                tokens.push(stringToToken[sym]());
            } else {
                throw new Error(`Unexpected symbol token: ${sym}`);
            }
        } else if (name) {
            tokens.push(identifier(name));
        }
        // TODO: check if there are leftover characters between token matches
    }

    return tokens;
};
