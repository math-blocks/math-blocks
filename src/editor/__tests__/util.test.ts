import * as Editor from "../editor";
import {isEqual} from "../util";

const row = (str: string): Editor.Row<Editor.Glyph> =>
    Editor.row(str.split("").map(glyph => Editor.glyph(glyph)));

const parens = (str: string): Editor.Parens<Editor.Glyph> =>
    Editor.parens(str.split("").map(glyph => Editor.glyph(glyph)));

const frac = (num: string, den: string): Editor.Frac<Editor.Glyph> =>
    Editor.frac(
        num.split("").map(glyph => Editor.glyph(glyph)),
        den.split("").map(glyph => Editor.glyph(glyph)),
    );

const sqrt = (radicand: string): Editor.Root<Editor.Glyph> =>
    Editor.root(
        radicand.split("").map(glyph => Editor.glyph(glyph)),
        null,
    );

const root = (radicand: string, index: string): Editor.Root<Editor.Glyph> =>
    Editor.root(
        radicand.split("").map(glyph => Editor.glyph(glyph)),
        index.split("").map(glyph => Editor.glyph(glyph)),
    );

const sup = (sup: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        undefined,
        sup.split("").map(glyph => Editor.glyph(glyph)),
    );

const sub = (sub: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        sub.split("").map(glyph => Editor.glyph(glyph)),
        undefined,
    );

const subsup = (sub: string, sup: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        sub.split("").map(glyph => Editor.glyph(glyph)),
        sup.split("").map(glyph => Editor.glyph(glyph)),
    );

describe("isEqual", () => {
    describe("equal", () => {
        it("1 + 2", () => {
            const result = isEqual(row("1+2"), row("1+2"));
            expect(result).toBe(true);
        });

        it("(1 + 2)", () => {
            const result = isEqual(parens("1+2"), parens("1+2"));
            expect(result).toBe(true);
        });

        it("a/b", () => {
            const result = isEqual(frac("a", "b"), frac("a", "b"));
            expect(result).toBe(true);
        });

        it("√1+2", () => {
            const result = isEqual(sqrt("1+2"), sqrt("1+2"));
            expect(result).toBe(true);
        });

        it("^3√1+2", () => {
            const result = isEqual(root("1+2", "3"), root("1+2", "3"));
            expect(result).toBe(true);
        });

        it("a_n", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("a"), sub("n")]),
                Editor.row([Editor.glyph("a"), sub("n")]),
            );
            expect(result).toBe(true);
        });

        it("e^x", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("e"), sup("x")]),
                Editor.row([Editor.glyph("e"), sup("x")]),
            );
            expect(result).toBe(true);
        });

        it("e_n^x", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("e"), subsup("n", "x")]),
                Editor.row([Editor.glyph("e"), subsup("n", "x")]),
            );
            expect(result).toBe(true);
        });
    });

    describe("not equal", () => {
        it("(1 + 2) != 1 + 2", () => {
            const result = isEqual(parens("1+2"), row("1+2"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 3", () => {
            const result = isEqual(row("1+2"), row("1+3"));
            expect(result).toBe(false);
        });

        it("1 + 2 != 1 + 2 + 3", () => {
            const result = isEqual(row("1+2"), row("1+2+3"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 3)", () => {
            const result = isEqual(parens("1+2"), parens("1+3"));
            expect(result).toBe(false);
        });

        it("(1 + 2) != (1 + 2 + 3)", () => {
            const result = isEqual(parens("1+2"), parens("1+2+3"));
            expect(result).toBe(false);
        });

        it("a/b == a/c", () => {
            const result = isEqual(frac("a", "b"), frac("a", "c"));
            expect(result).toBe(false);
        });

        it("√1+2 != √1+3", () => {
            const result = isEqual(sqrt("1+2"), sqrt("1+3"));
            expect(result).toBe(false);
        });

        it("^a√1+2 != ^b√1+2", () => {
            const result = isEqual(root("1+2", "a"), root("1+2", "b"));
            expect(result).toBe(false);
        });

        it("√1+2 != ^2√1+2", () => {
            const result = isEqual(sqrt("1+2"), root("1+2", "2"));
            expect(result).toBe(false);
        });

        it("a_n != a_m", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("a"), sub("n")]),
                Editor.row([Editor.glyph("a"), sub("m")]),
            );
            expect(result).toBe(false);
        });

        it("a_n != a^n", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("a"), sub("n")]),
                Editor.row([Editor.glyph("a"), sup("n")]),
            );
            expect(result).toBe(false);
        });

        it("e^x != e^y", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("e"), sup("x")]),
                Editor.row([Editor.glyph("e"), sup("y")]),
            );
            expect(result).toBe(false);
        });

        it("e_n^x != e^y", () => {
            const result = isEqual(
                Editor.row([Editor.glyph("e"), subsup("n", "x")]),
                Editor.row([Editor.glyph("e"), sup("y")]),
            );
            expect(result).toBe(false);
        });
    });
});
