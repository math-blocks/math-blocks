import * as Editor from "../editor-ast";
import * as Util from "../util";

describe("isEqual", () => {
    describe("equal", () => {
        it("1 + 2", () => {
            const result = Util.isEqual(Util.row("1+2"), Util.row("1+2"));
            expect(result).toBe(true);
        });

        it("(1 + 2)", () => {
            const result = Util.isEqual(Util.row("(1+2)"), Util.row("(1+2)"));
            expect(result).toBe(true);
        });

        it("a/b", () => {
            const result = Util.isEqual(Util.frac("a", "b"), Util.frac("a", "b"));
            expect(result).toBe(true);
        });

        it("√1+2", () => {
            const result = Util.isEqual(Util.sqrt("1+2"), Util.sqrt("1+2"));
            expect(result).toBe(true);
        });

        it("^3√1+2", () => {
            const result = Util.isEqual(Util.root("1+2", "3"), Util.root("1+2", "3"));
            expect(result).toBe(true);
        });

        it("a_n", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("a"), Util.sub("n")]),
                Editor.row([Editor.glyph("a"), Util.sub("n")]),
            );
            expect(result).toBe(true);
        });

        it("e^x", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("e"), Util.sup("x")]),
                Editor.row([Editor.glyph("e"), Util.sup("x")]),
            );
            expect(result).toBe(true);
        });

        it("e_n^x", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("e"), Util.subsup("n", "x")]),
                Editor.row([Editor.glyph("e"), Util.subsup("n", "x")]),
            );
            expect(result).toBe(true);
        });
    });

    describe("not equal", () => {
        it("(1 + 2) != 1 + 2", () => {
            const result = Util.isEqual(Util.row("(1+2)"), Util.row("1+2"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 3", () => {
            const result = Util.isEqual(Util.row("1+2"), Util.row("1+3"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 2 + 3", () => {
            const result = Util.isEqual(Util.row("1+2"), Util.row("1+2+3"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 3)", () => {
            const result = Util.isEqual(Util.row("(1+2)"), Util.row("(1+3)"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 2 + 3)", () => {
            const result = Util.isEqual(Util.row("(1+2)"), Util.row("(1+2+3)"));
            expect(result).toBe(false);
        });

        it("a/b == a/c", () => {
            const result = Util.isEqual(Util.frac("a", "b"), Util.frac("a", "c"));
            expect(result).toBe(false);
        });

        it("√1+2 != √1+3", () => {
            const result = Util.isEqual(Util.sqrt("1+2"), Util.sqrt("1+3"));
            expect(result).toBe(false);
        });

        it("^a√1+2 != ^b√1+2", () => {
            const result = Util.isEqual(Util.root("1+2", "a"), Util.root("1+2", "b"));
            expect(result).toBe(false);
        });

        it("√1+2 != ^2√1+2", () => {
            const result = Util.isEqual(Util.sqrt("1+2"), Util.root("1+2", "2"));
            expect(result).toBe(false);
        });

        it("a_n != a_m", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("a"), Util.sub("n")]),
                Editor.row([Editor.glyph("a"), Util.sub("m")]),
            );
            expect(result).toBe(false);
        });

        it("a_n != a^n", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("a"), Util.sub("n")]),
                Editor.row([Editor.glyph("a"), Util.sup("n")]),
            );
            expect(result).toBe(false);
        });

        it("e^x != e^y", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("e"), Util.sup("x")]),
                Editor.row([Editor.glyph("e"), Util.sup("y")]),
            );
            expect(result).toBe(false);
        });

        it("e_n^x != e^y", () => {
            const result = Util.isEqual(
                Editor.row([Editor.glyph("e"), Util.subsup("n", "x")]),
                Editor.row([Editor.glyph("e"), Util.sup("y")]),
            );
            expect(result).toBe(false);
        });
    });
});
