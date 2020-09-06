import {State} from "../above-reducer";
import * as Editor from "../editor-ast";
import * as Util from "../util";

const {glyph, row} = Editor;

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
            const result = Util.isEqual(
                Util.frac("a", "b"),
                Util.frac("a", "b"),
            );
            expect(result).toBe(true);
        });

        it("√1+2", () => {
            const result = Util.isEqual(Util.sqrt("1+2"), Util.sqrt("1+2"));
            expect(result).toBe(true);
        });

        it("^3√1+2", () => {
            const result = Util.isEqual(
                Util.root("1+2", "3"),
                Util.root("1+2", "3"),
            );
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
            const result = Util.isEqual(
                Util.frac("a", "b"),
                Util.frac("a", "c"),
            );
            expect(result).toBe(false);
        });

        it("√1+2 != √1+3", () => {
            const result = Util.isEqual(Util.sqrt("1+2"), Util.sqrt("1+3"));
            expect(result).toBe(false);
        });

        it("^a√1+2 != ^b√1+2", () => {
            const result = Util.isEqual(
                Util.root("1+2", "a"),
                Util.root("1+2", "b"),
            );
            expect(result).toBe(false);
        });

        it("√1+2 != ^2√1+2", () => {
            const result = Util.isEqual(
                Util.sqrt("1+2"),
                Util.root("1+2", "2"),
            );
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

    describe("layoutCursorFromState", () => {
        describe("row", () => {
            test("same location", () => {
                const math = Util.row("1+2+3");
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 1,
                        next: 2,
                    },
                    selectionStart: {
                        path: [],
                        prev: 1,
                        next: 2,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 1,
                    next: 2,
                    selection: false,
                });
            });

            test("cursor to the right of the selection start", () => {
                const math = Util.row("1+2+3");
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 3,
                        next: 4,
                    },
                    selectionStart: {
                        path: [],
                        prev: 1,
                        next: 2,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 1,
                    next: 4,
                    selection: true,
                });
            });

            test("cursor to the left of the selection start", () => {
                const math = Util.row("1+2+3");
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 0,
                        next: 1,
                    },
                    selectionStart: {
                        path: [],
                        prev: 1,
                        next: 2,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 0,
                    next: 2,
                    selection: true,
                });
            });

            test("cursor left to the start of the row", () => {
                const math = Util.row("1+2+3");
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: -Infinity,
                        next: 0,
                    },
                    selectionStart: {
                        path: [],
                        prev: 0,
                        next: 1,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: -Infinity,
                    next: 1,
                    selection: true,
                });
            });

            test("cursor right to the start of the row", () => {
                const math = Util.row("1+2+3");
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 4,
                        next: Infinity,
                    },
                    selectionStart: {
                        path: [],
                        prev: 3,
                        next: 4,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 3,
                    next: Infinity,
                    selection: true,
                });
            });
        });

        describe("frac", () => {
            test("around a frac", () => {
                const math = row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]);
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 0,
                        next: 1,
                    },
                    selectionStart: {
                        path: [],
                        prev: 3,
                        next: 4,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 0,
                    next: 4,
                    selection: true,
                });
            });

            test("starting in a fraction and cursor to the right", () => {
                const math = row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]);
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 2,
                        next: 3,
                    },
                    selectionStart: {
                        path: [2, 0 /* NUMERATOR */],
                        prev: -Infinity,
                        next: 1,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 1,
                    next: 3,
                    selection: true,
                });
            });

            test("starting in a fraction and cursor to the left", () => {
                const math = row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]);
                const state: State = {
                    math,
                    cursor: {
                        path: [],
                        prev: 0,
                        next: 1,
                    },
                    selectionStart: {
                        path: [2, 0 /* NUMERATOR */],
                        prev: -Infinity,
                        next: 1,
                    },
                };

                const layoutCursor = Util.layoutCursorFromState(state);

                expect(layoutCursor).toEqual({
                    parent: state.math.id,
                    prev: 0,
                    next: 3,
                    selection: true,
                });
            });
        });
    });
});
