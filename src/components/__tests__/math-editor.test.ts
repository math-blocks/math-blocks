import * as Editor from "../../editor/editor";
import * as Util from "../../editor/util";

import {State} from "../../editor/editor-reducer";
import {layoutCursorFromState} from "../math-editor";

const {glyph, row} = Editor;

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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[1].id,
                next: math.children[2].id,
                selection: true,
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[1].id,
                next: math.children[4].id,
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[0].id,
                next: math.children[2].id,
                selection: true,
            });
        });

        test("cursor left to the start of the row", () => {
            const math = Util.row("1+2+3");
            const state: State = {
                math,
                cursor: {
                    path: [],
                    prev: null,
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
                prev: null,
                next: math.children[1].id,
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
                    next: null,
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
                prev: math.children[3].id,
                next: null,
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

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[0].id,
                next: math.children[4].id,
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
                    prev: null,
                    next: 1,
                },
            };

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[1].id,
                next: math.children[3].id,
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
                    prev: null,
                    next: 1,
                },
            };

            const layoutCursor = layoutCursorFromState(state);

            expect(layoutCursor).toEqual({
                parent: state.math.id,
                prev: math.children[0].id,
                next: math.children[3].id,
                selection: true,
            });
        });
    });
});
