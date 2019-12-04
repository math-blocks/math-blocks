// @flow
import {
    lex,
    plus,
    number,
    identifier,
    minus,
    lparen,
    rparen,
} from "../text-lexer.js";

describe("TextLexer", () => {
    it("should parse numbers and plus signs", () => {
        const tokens = lex("1 + 2 + 3");
        expect(tokens).toEqual([
            number("1"),
            plus(),
            number("2"),
            plus(),
            number("3"),
        ]);
    });

    it("should parse identifiers and minus signs", () => {
        const tokens = lex("a - b");
        expect(tokens).toEqual([identifier("a"), minus(), identifier("b")]);
    });

    it("should parse parens", () => {
        const tokens = lex("(a + b)");
        expect(tokens).toEqual([
            lparen(),
            identifier("a"),
            plus(),
            identifier("b"),
            rparen(),
        ]);
    });
});
