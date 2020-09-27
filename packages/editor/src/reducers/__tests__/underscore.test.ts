import reducer, {State} from "../../row-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {SUB} from "../../constants";

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

describe("underscore", () => {
    it("'_' should insert a new sub at the end", () => {
        const math = Util.row("a");
        const cursor = {
            path: [],
            prev: 0,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "_"});

        expect(newState.cursor).toEqual({
            path: [1, SUB],
            prev: -Infinity,
            next: Infinity,
        });
    });

    it("'_' should insert a new sup in the middle end", () => {
        const math = Util.row("ab");
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "_"});

        expect(newState.cursor).toEqual({
            path: [1, SUB],
            prev: -Infinity,
            next: Infinity,
        });
    });

    it("'_' should navigate into an existing sub", () => {
        const math = row([glyph("a"), Util.sub("x")]);
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "_"});

        expect(newState.math).toEqualMath(math);
        expect(newState.cursor).toEqual({
            path: [1, SUB],
            prev: -Infinity,
            next: 0,
        });
    });
});
