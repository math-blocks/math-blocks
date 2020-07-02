import * as Editor from "@math-blocks/editor";

import {State} from "@math-blocks/editor";
import {layoutCursorFromState} from "../util";

const {glyph, row} = Editor;

describe("layoutCursorFromState", () => {
    describe("row", () => {
        test("same location", () => {
            const math = Editor.Util.row("1+2+3");
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: 1,
                next: 2,
                selection: false,
            });
        });

        test("cursor to the right of the selection start", () => {
            const math = Editor.Util.row("1+2+3");
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: 1,
                next: 4,
                selection: true,
            });
        });

        test("cursor to the left of the selection start", () => {
            const math = Editor.Util.row("1+2+3");
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: 0,
                next: 2,
                selection: true,
            });
        });

        test("cursor left to the start of the row", () => {
            const math = Editor.Util.row("1+2+3");
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: -Infinity,
                next: 1,
                selection: true,
            });
        });

        test("cursor right to the start of the row", () => {
            const math = Editor.Util.row("1+2+3");
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

            const layoutCursor = layoutCursorFromState(state);

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
                Editor.Util.frac("x+1", "y-1"),
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

            const layoutCursor = layoutCursorFromState(state);

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
                Editor.Util.frac("x+1", "y-1"),
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

            const layoutCursor = layoutCursorFromState(state);

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
                Editor.Util.frac("x+1", "y-1"),
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: 0,
                next: 3,
                selection: true,
            });
        });
    });
});
