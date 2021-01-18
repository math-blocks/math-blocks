import reducer, {State} from "../../row-reducer";
import * as Util from "../../util";
import {toEqualMath} from "../../test-util";

expect.extend({toEqualMath});

describe("insertChar", () => {
    describe("a regular character", () => {
        it("a the start", () => {
            const math = Util.row("+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "1"});

            expect(newState.math).toEqualMath(Util.row("1+2"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("in the middle", () => {
            const math = Util.row("12");
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "+"});

            expect(newState.math).toEqualMath(Util.row("1+2"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        it("at the end", () => {
            const math = Util.row("1+");
            const cursor = {
                path: [],
                prev: 1,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "2"});

            expect(newState.math).toEqualMath(Util.row("1+2"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: Infinity,
            });
        });
    });

    describe("inserting '-' inserts '\u2212'", () => {
        test("in the middle of a row", () => {
            const math = Util.row("ab");
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "-"});
            expect(newState.math).toEqualMath(Util.row("a\u2212b"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        test("at the end of a row", () => {
            const math = Util.row("a");
            const cursor = {
                path: [],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "-"});
            expect(newState.math).toEqualMath(Util.row("a\u2212"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: Infinity,
            });
        });

        test("at the start of a row", () => {
            const math = Util.row("a");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "-"});
            expect(newState.math).toEqualMath(Util.row("\u2212a"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });
    });

    describe("insert '*' inserts '\u00B7'", () => {
        it("in the middle of the row", () => {
            const math = Util.row("ab");
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "*"});
            expect(newState.math).toEqualMath(Util.row("a\u00B7b"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        it("at the end of a row", () => {
            const math = Util.row("a");
            const cursor = {
                path: [],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "*"});
            expect(newState.math).toEqualMath(Util.row("a\u00B7"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: Infinity,
            });
        });

        it("at the start of a row", () => {
            const math = Util.row("a");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "*"});
            expect(newState.math).toEqualMath(Util.row("\u00B7a"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });
    });
});
