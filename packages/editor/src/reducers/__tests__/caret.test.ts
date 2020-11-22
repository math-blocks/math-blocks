import reducer, {State} from "../../row-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {SUB, SUP} from "../../constants";
import {toEqualMath} from "../../test-util";

const {row, glyph} = Editor;

expect.extend({toEqualMath});

describe("caret", () => {
    it("'^' should insert a new sup at the end", () => {
        const math = Util.row("a");
        const cursor = {
            path: [],
            prev: 0,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "^"});

        expect(newState.cursor).toEqual({
            path: [1, SUP],
            prev: -Infinity,
            next: Infinity,
        });
    });

    it("'^' should insert a new sup in the middle end", () => {
        const math = Util.row("ab");
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "^"});

        expect(newState.cursor).toEqual({
            path: [1, SUP],
            prev: -Infinity,
            next: Infinity,
        });
    });

    it("'^' should navigate into an existing sup", () => {
        const math = row([glyph("a"), Util.sup("x")]);
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "^"});

        expect(newState.math).toEqualMath(math);
        expect(newState.cursor).toEqual({
            path: [1, SUP],
            prev: -Infinity,
            next: 0,
        });
    });

    it("'^' should change an existing sub into an subsup", () => {
        const math = row([glyph("a"), Util.sub("x")]);
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "^"});

        expect(newState.math).toEqualMath(
            row([glyph("a"), Util.subsup("x", "")]),
        );
        expect(newState.cursor).toEqual({
            path: [1, SUP],
            prev: -Infinity,
            next: Infinity,
        });
    });

    it("'^' should change an existing sup into an subsup", () => {
        const math = row([glyph("a"), Util.sup("x")]);
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "_"});

        expect(newState.math).toEqualMath(
            row([glyph("a"), Util.subsup("", "x")]),
        );
        expect(newState.cursor).toEqual({
            path: [1, SUB],
            prev: -Infinity,
            next: Infinity,
        });
    });
});
