// @flow
import reducer from "../reducer.js";
import * as UniqueId from "../unique-id.js";
import * as Editor from "../editor.js";
const {row, glyph, frac, subsup} = Editor;

import type {State} from "../reducer.js";

describe.only("reducer", () => {
    describe("inserting", () => {
        it("insert a charcater and advance the cursor", () => {
            const math = row([glyph("1"), glyph("+")]);
            const cursor = {
                path: [math.id],
                prev: math.children[1].id,
                next: null,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "2"});

            expect(Editor.stripIDs(newState.math)).toEqual(
                Editor.stripIDs(row([glyph("1"), glyph("+"), glyph("2")])),
            );

            expect(newState.cursor).toEqual({
                path: [newState.math.id],
                prev: newState.math.children[2].id,
                next: null,
            });
        });
    });

    describe("deleting", () => {
        describe("root", () => {
            it("from the back should delete the last character and the cursor should remain at the end", () => {
                const math = row([glyph("1"), glyph("+")]);
                const cursor = {
                    path: [math.id],
                    prev: math.children[1].id,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("1")])),
                );

                expect(newState.cursor).toEqual({
                    path: [newState.math.id],
                    prev: newState.math.children[0].id,
                    next: null,
                });
            });

            it("from the front should do nothing", () => {
                const math = row([glyph("1"), glyph("+")]);
                const cursor = {
                    path: [math.id],
                    prev: null,
                    next: math.children[0].id,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("1"), glyph("+")])),
                );

                expect(newState.cursor).toEqual({
                    path: [newState.math.id],
                    prev: null,
                    next: newState.math.children[0].id,
                });
            });
        });

        describe.skip("subsup", () => {
            it("from the back should delete the last character and the cursor should remain at the end", () => {
                const x = glyph("x");
                const math = row([glyph("e"), subsup(undefined, [x])]);
                const path = Editor.getPath(math, x.id); // ?
                const cursor = {
                    path: path || [],
                    prev: x.id,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "Backspace"});
                console.log(newState);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("e"), subsup(undefined, [])])),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
                    next: null,
                });
            });
        });
    });
});
