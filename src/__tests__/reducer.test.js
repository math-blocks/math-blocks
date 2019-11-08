// @flow
import reducer from "../reducer.js";
import * as UniqueId from "../unique-id.js";
import * as Editor from "../editor.js";
const {row, glyph, frac, subsup} = Editor;

import type {State} from "../reducer.js";

describe("reducer", () => {
    describe("inserting", () => {
        it("insert a charcater and advance the cursor", () => {
            const math = row([glyph("1"), glyph("+")]);
            const cursor = {
                path: [],
                prev: 1,
                next: null,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "2"});

            expect(Editor.stripIDs(newState.math)).toEqual(
                Editor.stripIDs(row([glyph("1"), glyph("+"), glyph("2")])),
            );

            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: null,
            });
        });
    });

    describe("deleting", () => {
        describe("root", () => {
            it("from the back should delete the last character and the cursor should remain at the end", () => {
                const math = row([glyph("1"), glyph("+")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("1")])),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: null,
                });
            });

            it("from the front should do nothing", () => {
                const math = row([glyph("1"), glyph("+")]);
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("1"), glyph("+")])),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
                    next: 0,
                });
            });
        });

        describe("subsup", () => {
            it("from the back should delete the last character in the sup", () => {
                const x = glyph("x");
                const math = row([glyph("e"), subsup(undefined, [x])]);
                const cursor = {
                    path: [1, 1],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("e"), subsup(undefined, [])])),
                );

                expect(newState.cursor).toEqual({
                    path: [1, 1],
                    prev: null,
                    next: null,
                });
            });

            it("from the back should delete the last character in the sub", () => {
                const x = glyph("x");
                const math = row([glyph("e"), subsup([x], undefined)]);
                const cursor = {
                    path: [1, 0],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("e"), subsup([], undefined)])),
                );

                expect(newState.cursor).toEqual({
                    path: [1, 0],
                    prev: null,
                    next: null,
                });
            });
        });
    });
});
