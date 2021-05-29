import {glyph, row} from "../ast/builders";
import {toEqualMath} from "../test-util";
import * as util from "../ast/util";

expect.extend({toEqualMath});

describe("isEqual", () => {
    describe("equal", () => {
        it("1 + 2", () => {
            const result = util.isEqual(util.row("1+2"), util.row("1+2"));
            expect(result).toBe(true);
        });

        it("(1 + 2)", () => {
            const result = util.isEqual(util.row("(1+2)"), util.row("(1+2)"));
            expect(result).toBe(true);
        });

        it("a/b", () => {
            const result = util.isEqual(
                util.frac("a", "b"),
                util.frac("a", "b"),
            );
            expect(result).toBe(true);
        });

        it("√1+2", () => {
            const result = util.isEqual(util.sqrt("1+2"), util.sqrt("1+2"));
            expect(result).toBe(true);
        });

        it("^3√1+2", () => {
            const result = util.isEqual(
                util.root("1+2", "3"),
                util.root("1+2", "3"),
            );
            expect(result).toBe(true);
        });

        it("a_n", () => {
            const result = util.isEqual(
                row([glyph("a"), util.sub("n")]),
                row([glyph("a"), util.sub("n")]),
            );
            expect(result).toBe(true);
        });

        it("e^x", () => {
            const result = util.isEqual(
                row([glyph("e"), util.sup("x")]),
                row([glyph("e"), util.sup("x")]),
            );
            expect(result).toBe(true);
        });

        it("e_n^x", () => {
            const result = util.isEqual(
                row([glyph("e"), util.subsup("n", "x")]),
                row([glyph("e"), util.subsup("n", "x")]),
            );
            expect(result).toBe(true);
        });
    });

    describe("not equal", () => {
        it("(1 + 2) != 1 + 2", () => {
            const result = util.isEqual(util.row("(1+2)"), util.row("1+2"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 3", () => {
            const result = util.isEqual(util.row("1+2"), util.row("1+3"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 2 + 3", () => {
            const result = util.isEqual(util.row("1+2"), util.row("1+2+3"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 3)", () => {
            const result = util.isEqual(util.row("(1+2)"), util.row("(1+3)"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 2 + 3)", () => {
            const result = util.isEqual(util.row("(1+2)"), util.row("(1+2+3)"));
            expect(result).toBe(false);
        });

        it("a/b == a/c", () => {
            const result = util.isEqual(
                util.frac("a", "b"),
                util.frac("a", "c"),
            );
            expect(result).toBe(false);
        });

        it("√1+2 != √1+3", () => {
            const result = util.isEqual(util.sqrt("1+2"), util.sqrt("1+3"));
            expect(result).toBe(false);
        });

        it("^a√1+2 != ^b√1+2", () => {
            const result = util.isEqual(
                util.root("1+2", "a"),
                util.root("1+2", "b"),
            );
            expect(result).toBe(false);
        });

        it("√1+2 != ^2√1+2", () => {
            const result = util.isEqual(
                util.sqrt("1+2"),
                util.root("1+2", "2"),
            );
            expect(result).toBe(false);
        });

        it("a_n != a_m", () => {
            const result = util.isEqual(
                row([glyph("a"), util.sub("n")]),
                row([glyph("a"), util.sub("m")]),
            );
            expect(result).toBe(false);
        });

        it("a_n != a^n", () => {
            const result = util.isEqual(
                row([glyph("a"), util.sub("n")]),
                row([glyph("a"), util.sup("n")]),
            );
            expect(result).toBe(false);
        });

        it("e^x != e^y", () => {
            const result = util.isEqual(
                row([glyph("e"), util.sup("x")]),
                row([glyph("e"), util.sup("y")]),
            );
            expect(result).toBe(false);
        });

        it("e_n^x != e^y", () => {
            const result = util.isEqual(
                row([glyph("e"), util.subsup("n", "x")]),
                row([glyph("e"), util.sup("y")]),
            );
            expect(result).toBe(false);
        });
    });
});
