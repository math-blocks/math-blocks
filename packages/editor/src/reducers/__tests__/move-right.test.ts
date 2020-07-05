import reducer from "../../editor-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {State} from "../../state";
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

describe("moveRight", () => {
    const action = {type: "ArrowRight"};

    describe("row", () => {
        it("should move the cursor inside a row", () => {
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
                prev: 0,
                next: 1,
            });
        });

        it("should stop moving the cursor at the end of a row", () => {
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
                prev: 2,
                next: Infinity,
            });
        });
    });

    describe("subsup", () => {
        it("should enter a sub from the left", () => {
            const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            });
        });

        it("should enter an empty sub from the left", () => {
            const math = row([glyph("e"), Util.sub(""), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
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

        it("should enter a sup from the left", () => {
            const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            });
        });

        it("should enter an empty sup from the left", () => {
            const math = row([glyph("e"), Util.sup(""), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
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

        it("should enter a subsup from the left", () => {
            const math = row([glyph("e"), Util.subsup("a", "b"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            });
        });

        it("should exit a sub to the right", () => {
            const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: 0,
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

        it("should exit a sup to the right", () => {
            const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: 0,
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

        it("should exit a subsup to the right from within the sup", () => {
            const math = row([glyph("e"), Util.subsup("a", "b"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: 0,
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

        it("should move from the sub to the sup", () => {
            const math = row([glyph("e"), Util.subsup("a", "b"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            });
        });
    });

    describe("limits", () => {
        it("should enter the lower limit from the left", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [glyph("1"), glyph("+"), glyph("2")]),
                glyph("g"),
            ]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            });
        });

        it("should enter an empty lower limit from the left", () => {
            const math = row([glyph("e"), limits(glyph("f"), []), glyph("g")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
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

        it("should move from the lower limit to the upper limit", () => {
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
                prev: 2,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            });
        });

        it("should move from the lower limit to an upper limit", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [glyph("1"), glyph("+"), glyph("2")], []),
                glyph("g"),
            ]);
            const cursor = {
                path: [1, SUB],
                prev: 2,
                next: Infinity,
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

        it("should exit the lower limit if there's no upper limit", () => {
            const math = row([
                glyph("e"),
                limits(glyph("f"), [glyph("1"), glyph("+"), glyph("2")]),
                glyph("g"),
            ]);
            const cursor = {
                path: [1, SUB],
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

        it("should exit the upper limit", () => {
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
    });

    describe("frac", () => {
        test("entering the numerator from the left", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, NUMERATOR],
                prev: -Infinity,
                next: 0,
            });
        });

        test("entering an empty numerator from the left", () => {
            const math = row([glyph("a"), Util.frac("", "uv"), glyph("b")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
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

        test("moving from the numerator to the denominator", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [1, NUMERATOR],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: 0,
            });
        });

        test("moving from the numerator to an empty denominator", () => {
            const math = row([glyph("a"), Util.frac("xy", ""), glyph("b")]);
            const cursor = {
                path: [1, NUMERATOR],
                prev: 0,
                next: Infinity,
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

        test("exiting from the denominator to the right", () => {
            const math = row([glyph("a"), Util.frac("xy", "uv"), glyph("b")]);
            const cursor = {
                path: [1, DENOMINATOR],
                prev: 0,
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
    });

    describe("root", () => {
        test("entering sqrt", () => {
            const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, RADICAND],
                prev: -Infinity,
                next: 0,
            });
        });

        test("exiting sqrt with surround glyphs", () => {
            const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
            const cursor = {
                path: [1, RADICAND],
                prev: 1,
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

        test("exiting sqrt without surround glyphs", () => {
            const math = row([Util.sqrt("xy")]);
            const cursor = {
                path: [0, RADICAND],
                prev: 1,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: Infinity,
            });
        });
    });
});
