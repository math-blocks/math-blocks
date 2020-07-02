import reducer from "../../editor-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";
import {State} from "../../state";

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

describe("cancel", () => {
    it("should handle being called without a selection", () => {
        const math = Util.row("1+2");
        const cursor = {
            path: [],
            prev: Infinity,
            next: 0,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "CANCEL"});

        expect(newState.math).toEqualMath(Util.row("1+2"));
    });

    it("should clear the selection", () => {
        const math = Util.row("1+2");
        const selectionStart = {
            path: [],
            prev: -Infinity,
            next: 0,
        };
        const cursor = {
            path: [],
            prev: 2,
            next: Infinity,
        };

        const state: State = {math, cursor, selectionStart};
        const newState = reducer(state, {type: "CANCEL"});

        expect(newState.selectionStart).toBeUndefined();
    });

    it("should add a cancel region", () => {
        const math = Util.row("1+2");
        const selectionStart = {
            path: [],
            prev: -Infinity,
            next: 0,
        };
        const cursor = {
            path: [],
            prev: 0,
            next: 1,
        };

        const state: State = {math, cursor, selectionStart};
        const newState = reducer(state, {type: "CANCEL"});

        // TODO: try to avoid the need for unique IDs by relying on paths instead
        // We can convert paths to strings for easier comparison.
        expect(newState.cancelRegions).toEqual([
            {
                parent: expect.any(Number),
                prev: -Infinity,
                next: expect.any(Number),
                selection: true,
            },
        ]);
    });
});
