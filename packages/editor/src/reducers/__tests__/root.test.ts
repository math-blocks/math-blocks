import reducer, {State} from "../../row-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {RADICAND} from "../../constants";
import {toEqualMath} from "../../test-util";

const {row, glyph} = Editor;

expect.extend({toEqualMath});

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
