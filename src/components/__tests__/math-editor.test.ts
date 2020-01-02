import * as Editor from "../../editor/editor";
import * as Util from "../../editor/util";

import {State} from "../../editor/editor-reducer";
import {layoutCursorFromState} from "../math-editor";

const {glyph, row} = Editor;

describe("layoutCursorFromState", () => {
    describe("row", () => {
        test("same location", () => {
            const state: State = {
                math: Util.row("1+2+3"),
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
                selection: true,
            });
        });

        test("cursor to the right of the selection start", () => {
            const state: State = {
                math: Util.row("1+2+3"),
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
            const state: State = {
                math: Util.row("1+2+3"),
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
    });

    describe("frac", () => {
        test("around a frac", () => {
            const state: State = {
                math: row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]),
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
            const state: State = {
                math: row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]),
                cursor: {
                    path: [],
                    prev: 2,
                    next: 3,
                },
                selectionStart: {
                    path: [2, 0 /* NUMERATOR */],
                    prev: null,
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
            const state: State = {
                math: row([
                    glyph("1"),
                    glyph("+"),
                    Util.frac("x+1", "y-1"),
                    glyph("+"),
                    glyph("2"),
                ]),
                cursor: {
                    path: [],
                    prev: 0,
                    next: 1,
                },
                selectionStart: {
                    path: [2, 0 /* NUMERATOR */],
                    prev: null,
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
