import reducer, {State} from "../../above-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {RADICAND} from "../../constants";

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

describe("root", () => {
    it("\u221A should insert a frac node", () => {
        const math = Util.row("12");
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "\u221A"});

        expect(newState.math).toEqualMath(
            row([glyph("1"), Util.sqrt(""), glyph("2")]),
        );
        expect(newState.cursor).toEqual({
            path: [1, RADICAND],
            prev: -Infinity,
            next: Infinity,
        });
    });
});
