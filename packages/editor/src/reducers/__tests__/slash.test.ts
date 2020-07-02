import reducer from "../../editor-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {State} from "../../state";
import {NUMERATOR, DENOMINATOR} from "../../constants";

const {row, glyph} = Editor;

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

describe("slash", () => {
    it("'/' should insert a fraction", () => {
        const math = Util.row("eg");
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([Util.frac("e", ""), glyph("g")]),
        );
        expect(newState.cursor).toEqual({
            path: [0, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("inserting fractions at the end of a row", () => {
        const math = Util.row("eg");
        const cursor = {
            path: [],
            prev: 1,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(row([Util.frac("eg", "")]));
        expect(newState.cursor).toEqual({
            path: [0, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("inserting fractions with a '+' before it", () => {
        const math = Util.row("1+2");
        const cursor = {
            path: [],
            prev: 2,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([glyph("1"), glyph("+"), Util.frac("2", "")]),
        );
        expect(newState.cursor).toEqual({
            path: [2, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("inserting fractions with a '\u2212' before it", () => {
        const math = Util.row("1\u22122");
        const cursor = {
            path: [],
            prev: 2,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([glyph("1"), glyph("\u2212"), Util.frac("2", "")]),
        );
        expect(newState.cursor).toEqual({
            path: [2, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("inserting fractions with a '=' before it", () => {
        const math = Util.row("1=2");
        const cursor = {
            path: [],
            prev: 2,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([glyph("1"), glyph("="), Util.frac("2", "")]),
        );
        expect(newState.cursor).toEqual({
            path: [2, DENOMINATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("at the start of a row inserts an empty fraction", () => {
        const math = Util.row("1=2");
        const cursor = {
            path: [],
            prev: -Infinity,
            next: 0,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([Util.frac("", ""), glyph("1"), glyph("="), glyph("2")]),
        );
        expect(newState.cursor).toEqual({
            path: [0, NUMERATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });

    test("after a split char", () => {
        const math = Util.row("1=2");
        const cursor = {
            path: [],
            prev: 1,
            next: 2,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "/"});

        expect(newState.math).toEqualMath(
            row([glyph("1"), glyph("="), Util.frac("", ""), glyph("2")]),
        );
        expect(newState.cursor).toEqual({
            path: [2, NUMERATOR],
            prev: -Infinity,
            next: Infinity,
        });
    });
});
