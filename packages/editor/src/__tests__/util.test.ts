import {State} from "../row-reducer";
import * as Editor from "../editor-ast";
import * as Util from "../util";

const {glyph, row} = Editor;

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

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

describe("rowToColumns", () => {
    test("empty row", () => {
        const result = Util.rowToColumns(Util.row(""));

        expect(result).toEqual([{nodes: []}]);
    });

    test("row w/ no column separators", () => {
        // TODO: we have strip out IDs to make comparison easier
        const result = Util.rowToColumns(Util.row("123"));

        expect(result.length).toEqual(1);
        expect(result[0].nodes.length).toEqual(3);
    });

    test("row with one column separator with no content", () => {
        const result = Util.rowToColumns(Util.row("\u0008"));

        expect(result.length).toEqual(2);
        expect(result[0].nodes.length).toEqual(0);
        expect(result[1].nodes.length).toEqual(0);
    });

    test("row with mulitple column separator with no content", () => {
        const result = Util.rowToColumns(Util.row("\u0008\u0008\u0008"));

        expect(result.length).toEqual(4);
        expect(result[0].nodes.length).toEqual(0);
        expect(result[1].nodes.length).toEqual(0);
        expect(result[2].nodes.length).toEqual(0);
        expect(result[3].nodes.length).toEqual(0);
    });

    test("row with multiple column separators with content", () => {
        const result = Util.rowToColumns(Util.row("1\u0008+\u00082"));

        expect(result.length).toEqual(3);
        expect(result[0].nodes.length).toEqual(1);
        expect(result[1].nodes.length).toEqual(1);
        expect(result[1].nodes.length).toEqual(1);
    });
});

describe("columnsToRow", () => {
    test("zero columns throws", () => {
        expect(() => Util.columnsToRow([])).toThrowErrorMatchingInlineSnapshot(
            `"expected at least one column"`,
        );
    });

    test("one empty column", () => {
        const result = Util.columnsToRow([{nodes: []}]);

        expect(result).toEqual({
            id: -1,
            type: "row",
            children: [],
        });
    });

    test("two empty columns", () => {
        const result = Util.columnsToRow([{nodes: []}, {nodes: []}]);

        expect(result).toEqualMath(Util.row("\u0008"));
    });

    test("multiple empty columns", () => {
        const result = Util.columnsToRow([
            {nodes: []},
            {nodes: []},
            {nodes: []},
            {nodes: []},
        ]);

        expect(result).toEqualMath(Util.row("\u0008\u0008\u0008"));
    });

    test("one column w/ content", () => {
        // TODO: instead of a one-off type for columns, we could reuse
        // Editor.Row since we're splitting one large row up into multiple
        // smaller rows.
        const result = Util.columnsToRow([{nodes: [glyph("1"), glyph("2")]}]);

        expect(result).toEqualMath(Util.row("12"));
    });

    test("multiple columns w/ content", () => {
        // TODO: instead of a one-off type for columns, we could reuse
        // Editor.Row since we're splitting one large row up into multiple
        // smaller rows.
        const result = Util.columnsToRow([
            {nodes: [glyph("1")]},
            {nodes: [glyph("+")]},
            {nodes: [glyph("2")]},
        ]);

        expect(result).toEqualMath(Util.row("1\u0008+\u00082"));
    });

    test("multiple columns w/ some empty columns and some with content", () => {
        // TODO: instead of a one-off type for columns, we could reuse
        // Editor.Row since we're splitting one large row up into multiple
        // smaller rows.
        const result = Util.columnsToRow([
            {nodes: [glyph("1")]},
            {nodes: [glyph("+")]},
            {nodes: []},
        ]);

        expect(result).toEqualMath(Util.row("1\u0008+\u0008"));
    });
});

describe("cursorInColumns", () => {
    test("single empty column", () => {
        const result = Util.cursorInColumns([{nodes: []}], {
            path: [],
            prev: -Infinity,
            next: Infinity,
        });

        expect(result).toEqual({
            colIndex: 0,
            cursor: {
                path: [],
                prev: -Infinity,
                next: Infinity,
            },
        });
    });

    test("single column with content w/ cursor at start", () => {
        const result = Util.cursorInColumns(
            [{nodes: [Editor.glyph("1"), Editor.glyph("2")]}],
            {
                path: [],
                prev: -Infinity,
                next: 0,
            },
        );

        expect(result).toEqual({
            colIndex: 0,
            cursor: {
                path: [],
                prev: -Infinity,
                next: 0,
            },
        });
    });

    test("single column with content w/ cursor at end", () => {
        const result = Util.cursorInColumns(
            [{nodes: [Editor.glyph("1"), Editor.glyph("2")]}],
            {
                path: [],
                prev: 1,
                next: Infinity,
            },
        );

        expect(result).toEqual({
            colIndex: 0,
            cursor: {
                path: [],
                prev: 1,
                next: Infinity,
            },
        });
    });

    test("multiple empty columns with /w cursor at end of last row", () => {
        const result = Util.cursorInColumns(
            [{nodes: []}, {nodes: []}, {nodes: []}],
            {
                path: [],
                prev: 1,
                next: Infinity,
            },
        );

        expect(result).toEqual({
            colIndex: 2,
            cursor: {
                path: [],
                prev: -Infinity,
                next: Infinity,
            },
        });
    });

    test("multiple empty columns /w cursor inside middle column", () => {
        const result = Util.cursorInColumns(
            [{nodes: []}, {nodes: []}, {nodes: []}],
            {
                path: [],
                prev: 0,
                next: 1,
            },
        );

        expect(result).toEqual({
            colIndex: 1,
            cursor: {
                path: [],
                prev: -Infinity,
                next: Infinity,
            },
        });
    });

    test("middle of middle column with content", () => {
        const result = Util.cursorInColumns(
            [
                {nodes: []},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: []},
            ],
            {
                path: [],
                prev: 1,
                next: 2,
            },
        );

        expect(result).toEqual({
            colIndex: 1,
            cursor: {
                path: [],
                prev: 0,
                next: 1,
            },
        });
    });

    test("start of middle column with content", () => {
        const result = Util.cursorInColumns(
            [
                {nodes: []},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: []},
            ],
            {
                path: [],
                prev: 0,
                next: 1,
            },
        );

        expect(result).toEqual({
            colIndex: 1,
            cursor: {
                path: [],
                prev: -Infinity,
                next: 0,
            },
        });
    });

    test("end of middle column with content", () => {
        const result = Util.cursorInColumns(
            [
                {nodes: []},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: []},
            ],
            {
                path: [],
                prev: 2,
                next: 3,
            },
        );

        expect(result).toEqual({
            colIndex: 1,
            cursor: {
                path: [],
                prev: 1,
                next: Infinity,
            },
        });
    });

    test("middle of middle column with content (content in all columns)", () => {
        const result = Util.cursorInColumns(
            [
                {nodes: [Editor.glyph("1"), Editor.glyph("2")]},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: []},
            ],
            {
                path: [],
                prev: 3,
                next: 4,
            },
        );

        expect(result).toEqual({
            colIndex: 1,
            cursor: {
                path: [],
                prev: 0,
                next: 1,
            },
        });
    });

    test("throws on invalid cursor", () => {
        expect(() =>
            Util.cursorInColumns([{nodes: []}], {
                path: [],
                prev: 1,
                next: 2,
            }),
        ).toThrowErrorMatchingInlineSnapshot(`"Invalid cursor for columns"`);
    });
});

describe("cursorColumnToCursor", () => {
    test("first column of three empty columns", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 0,
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: Infinity,
                },
            },
            [{nodes: []}, {nodes: []}, {nodes: []}],
        );

        expect(result).toEqual({
            path: [],
            prev: -Infinity,
            next: 0,
        });
    });

    test("middle column of three empty columns", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 1,
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: Infinity,
                },
            },
            [{nodes: []}, {nodes: []}, {nodes: []}],
        );

        expect(result).toEqual({
            path: [],
            prev: 0,
            next: 1,
        });
    });

    test("last column of three empty columns", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 2,
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: Infinity,
                },
            },
            [{nodes: []}, {nodes: []}, {nodes: []}],
        );

        expect(result).toEqual({
            path: [],
            prev: 1,
            next: Infinity,
        });
    });

    test("start of middle column of three columns w/ content", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 1,
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
            },
            [
                {nodes: [Editor.glyph("1"), Editor.glyph("2")]},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: [Editor.glyph("a"), Editor.glyph("b")]},
            ],
        );

        expect(result).toEqual({
            path: [],
            prev: 2,
            next: 3,
        });
    });

    test("middle of middle column of three columns w/ content", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 1,
                cursor: {
                    path: [],
                    prev: 0,
                    next: 1,
                },
            },
            [
                {nodes: [Editor.glyph("1"), Editor.glyph("2")]},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: [Editor.glyph("a"), Editor.glyph("b")]},
            ],
        );

        expect(result).toEqual({
            path: [],
            prev: 3,
            next: 4,
        });
    });

    test("end of middle column of three columns w/ content", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 1,
                cursor: {
                    path: [],
                    prev: 1,
                    next: Infinity,
                },
            },
            [
                {nodes: [Editor.glyph("1"), Editor.glyph("2")]},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: [Editor.glyph("a"), Editor.glyph("b")]},
            ],
        );

        expect(result).toEqual({
            path: [],
            prev: 4,
            next: 5,
        });
    });

    test("start of last column of three columns w/ content", () => {
        const result = Util.columnCursorToCursor(
            {
                colIndex: 2,
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
            },
            [
                {nodes: [Editor.glyph("1"), Editor.glyph("2")]},
                {nodes: [Editor.glyph("x"), Editor.glyph("y")]},
                {nodes: [Editor.glyph("a"), Editor.glyph("b")]},
            ],
        );

        expect(result).toEqual({
            path: [],
            prev: 5,
            next: 6,
        });
    });
});
