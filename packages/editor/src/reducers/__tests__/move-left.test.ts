import reducer, {State} from "../../row-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {SUB, SUP, NUMERATOR, DENOMINATOR, RADICAND} from "../../constants";

const {row, glyph, limits} = Editor;

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

describe("moveLeft", () => {
    const action = {type: "ArrowLeft"};

    describe("row", () => {
        it("should move the cursor left within the row", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: 2,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        it("should stop moving the cursor at the start of a row", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
        });
    });

    describe("subsup", () => {
        it("should enter a sub from the right", () => {
            const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 2,
                next: Infinity,
            });
        });

        it("should enter an empty sub from the right", () => {
            const math = row([glyph("e"), Util.sub(""), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should enter a sup from the right", () => {
            const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 2,
                next: Infinity,
            });
        });

        it("should enter an empty sup from the right", () => {
            const math = row([glyph("e"), Util.sup(""), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should enter a subsup from the right", () => {
            const math = row([glyph("e"), Util.subsup("ab", "cd"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 1,
                next: Infinity,
            });
        });

        it("should exit a sub to the left", () => {
            const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should exit a sup to the left", () => {
            const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should exit a subsup to the left from within the sub", () => {
            const math = row([glyph("e"), Util.subsup("ab", "cd"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should move from the sup to the sub", () => {
            const math = row([glyph("e"), Util.subsup("ab", "cd"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 1,
                next: Infinity,
            });
        });
    });

    describe("limits", () => {
        it("should enter the lower limit from the right", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [glyph("1"), glyph("+"), glyph("2")]),
                glyph("g"),
            ]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 2,
                next: Infinity,
            });
        });

        it("should enter an empty lower limit from the right", () => {
            const math = row([glyph("e"), limits(glyph("f"), []), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should enter the upper limit from the right", () => {
            const math = row([
                glyph("e"),
                limits(
                    glyph("f"),
                    [glyph("1"), glyph("+"), glyph("2")],
                    [glyph("a"), glyph("-"), glyph("b")],
                ),
                glyph("g"),
            ]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 2,
                next: Infinity,
            });
        });

        it("should enter an empty upper limit from the right", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [glyph("1"), glyph("+"), glyph("2")], []),
                glyph("g"),
            ]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should move from the upper limit to the lower limit", () => {
            const math = row([
                glyph("e"),
                limits(
                    glyph("f"),
                    [glyph("1"), glyph("+"), glyph("2")],
                    [glyph("a"), glyph("-"), glyph("b")],
                ),
                glyph("g"),
            ]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 2,
                next: Infinity,
            });
        });

        it("should move from the upper limit to an empty lower limit", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [], [glyph("a"), glyph("-"), glyph("b")]),
                glyph("g"),
            ]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should exit the lower limit", () => {
            const math = row([
                glyph("e"),
                limits(
                    glyph("f"),
                    [glyph("1"), glyph("+"), glyph("2")],
                    [glyph("a"), glyph("-"), glyph("b")],
                ),
                glyph("g"),
            ]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });
    });

    describe("frac", () => {
        test("entering the denominator from the right", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, DENOMINATOR],
                prev: 1,
                next: Infinity,
            });
        });

        test("entering an empty denominator from the right", () => {
            const math = row([glyph("a"), Util.frac("xy", ""), glyph("b")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: Infinity,
            });
        });

        test("moving from the denonminator to the numerator", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, NUMERATOR],
                prev: 1,
                next: Infinity,
            });
        });

        test("moving from the denonminator to an empty numerator", () => {
            const math = row([glyph("a"), Util.frac("", "uv"), glyph("b")]);
            const cursor = {
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, NUMERATOR],
                prev: -Infinity,
                next: Infinity,
            });
        });

        test("exiting from the numerator to the left", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [1, NUMERATOR],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });
    });

    describe("root", () => {
        test("entering sqrt", () => {
            const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, RADICAND],
                prev: 1,
                next: Infinity,
            });
        });

        test("exiting sqrt with surround glyphs", () => {
            const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
            const cursor = {
                path: [1, RADICAND],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        test("exiting sqrt without surround glyphs", () => {
            const math = row([Util.sqrt("xy")]);
            const cursor = {
                path: [0, RADICAND],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
        });
    });
});
