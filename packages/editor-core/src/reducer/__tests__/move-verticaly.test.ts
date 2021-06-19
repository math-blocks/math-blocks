import * as builders from "../../ast/builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {moveVertically} from "../move-vertically";
import {toEqualEditorNodes, zrow} from "../test-util";

import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

const zipperToState = (zipper: Zipper): State => {
    return {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };
};

describe("moveVertically", () => {
    const smallTable = builders.table(
        [
            [builders.glyph("a")],
            [builders.glyph("b")],
            [builders.glyph("c")],
            [builders.glyph("d")],
        ],
        2,
        2,
    );

    const largeTable = builders.table(
        [
            [builders.glyph("a")],
            [builders.glyph("b")],
            null,
            null,
            [builders.glyph("c")],
            [builders.glyph("d")],
        ],
        2,
        3,
    );

    test("moving down", () => {
        const zipper: Zipper = {
            row: zrow([], [smallTable]),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveRight(state);
        state = moveVertically(state, "down");

        expect(state.zipper.row.right).toEqualEditorNodes([
            builders.glyph("c"),
        ]);
    });

    test("moving down stops at the bottom", () => {
        const zipper: Zipper = {
            row: zrow([], [smallTable]),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveRight(state);
        state = moveVertically(state, "down");
        const newState = moveVertically(state, "down");

        expect(newState).toEqual(state);
    });

    test("moving down skips over null cells", () => {
        const zipper: Zipper = {
            row: zrow([], [largeTable]),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveRight(state);
        state = moveVertically(state, "down");

        expect(state.zipper.row.right).toEqualEditorNodes([
            builders.glyph("c"),
        ]);
    });

    test("moving down when selecting does nothing", () => {
        const zipper: Zipper = {
            row: zrow([], [smallTable]),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveRight(state);
        state = moveVertically({...state, selecting: true}, "down");

        expect(state.zipper.row.right).toEqualEditorNodes([
            builders.glyph("a"),
        ]);
    });

    test("moving up", () => {
        const zipper: Zipper = {
            row: zrow([smallTable], []),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveLeft(state);
        state = moveVertically(state, "up");

        expect(state.zipper.row.left).toEqualEditorNodes([builders.glyph("b")]);
    });

    test("moving up stops at the top", () => {
        const zipper: Zipper = {
            row: zrow([smallTable], []),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveLeft(state);
        state = moveVertically(state, "up");
        const newState = moveVertically(state, "up");

        expect(newState).toEqual(state);
    });

    test("moving up skips over null cells", () => {
        const zipper: Zipper = {
            row: zrow([largeTable], []),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveLeft(state);
        state = moveVertically(state, "up");

        expect(state.zipper.row.left).toEqualEditorNodes([builders.glyph("b")]);
    });

    test("moving up when selecting does nothing", () => {
        const zipper: Zipper = {
            row: zrow(
                [
                    builders.table(
                        [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ],
                        2,
                        2,
                    ),
                ],
                [],
            ),
            breadcrumbs: [],
        };
        let state = zipperToState(zipper);
        state = moveLeft(state);
        state = moveVertically({...state, selecting: true}, "up");

        expect(state.zipper.row.left).toEqualEditorNodes([builders.glyph("d")]);
    });

    test("ignores non-table nodes", () => {
        const zipper: Zipper = {
            row: zrow([], [builders.glyph("a")]),
            breadcrumbs: [],
        };
        const state = zipperToState(zipper);
        const newState = moveVertically(state, "up");

        expect(newState).toEqual(state);
    });
});
