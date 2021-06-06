import {cancel} from "../cancel";
import {moveRight} from "../move-right";

import {row, frac, stateFromZipper} from "../test-util";

import type {Zipper} from "../types";
import {getId} from "@math-blocks/core";

describe("cancel", () => {
    test("single cancel region", () => {
        const zipper: Zipper = {
            row: {
                id: getId(),
                type: "zrow",
                left: row("2").children,
                selection: row("x+5").children,
                right: row("=10").children,
                style: {},
            },
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);
        const cancelId = -1;

        const newState = cancel(state, cancelId);

        expect(newState.zipper.row.selection).toHaveLength(3);
        expect(
            newState.zipper.row.selection.every(
                (node) => node.style.cancel === cancelId,
            ),
        ).toBeTruthy();
        expect(
            newState.startZipper.row.right
                .slice(0, 3)
                .every((node) => node.style.cancel === cancelId),
        ).toBeTruthy();
        expect(
            newState.endZipper.row.left
                .slice(1)
                .every((node) => node.style.cancel === cancelId),
        ).toBeTruthy();
    });

    test("two side-by-side cancel regions", () => {
        const zipper: Zipper = {
            row: {
                id: getId(),
                type: "zrow",
                left: [],
                selection: [],
                right: row("2x+5=10").children,
                style: {},
            },
            breadcrumbs: [],
        };
        let state = stateFromZipper(zipper);
        state = {...state, selecting: true};
        state = moveRight(state);
        state = cancel(state, -1);
        state = {
            ...state,
            startZipper: state.endZipper,
            zipper: state.endZipper,
        };
        state = moveRight(state);
        state = cancel(state, -2);

        expect(state.endZipper.row.left).toHaveLength(2);
        expect(state.endZipper.row.left[0].style.cancel).toEqual(-1);
        expect(state.endZipper.row.left[1].style.cancel).toEqual(-2);

        expect(state.zipper.row.left[0].style.cancel).toEqual(-1);
        expect(state.zipper.row.selection).toHaveLength(1);
        expect(state.zipper.row.selection[0].style.cancel).toEqual(-2);

        expect(state.startZipper.row.left[0].style.cancel).toEqual(-1);
        expect(state.startZipper.row.right[0].style.cancel).toEqual(-2);
    });

    test("clearing a cancel region", () => {
        const zipper: Zipper = {
            row: {
                id: getId(),
                type: "zrow",
                left: row("2").children,
                selection: row("x+5").children,
                right: row("=10").children,
                style: {},
            },
            breadcrumbs: [],
        };
        zipper.row.selection.forEach((node) => (node.style.cancel = -1));
        const state = stateFromZipper(zipper);

        const newState = cancel(state);

        expect(newState.zipper.row.selection).toHaveLength(3);
        expect(
            newState.zipper.row.selection.every(
                (node) => node.style.cancel === undefined,
            ),
        ).toBeTruthy();
        expect(
            newState.startZipper.row.right
                .slice(0, 3)
                .every((node) => node.style.cancel === undefined),
        ).toBeTruthy();
        expect(
            newState.endZipper.row.left
                .slice(1)
                .every((node) => node.style.cancel === undefined),
        ).toBeTruthy();
    });

    test("nested cancel regions are not allowed", () => {
        const zipper: Zipper = {
            row: {
                id: getId(),
                type: "zrow",
                left: [],
                selection: [frac("1", "2")],
                right: [],
                style: {},
            },
            breadcrumbs: [],
        };
        // @ts-expect-error: we know this is a fraction
        zipper.row.selection[0].children[0].children[0].style.cancel = -1;
        // @ts-expect-error: we know this is a fraction
        zipper.row.selection[0].children[1].children[0].style.cancel = -1;

        const state = stateFromZipper(zipper);

        const newState = cancel(state, -2);

        expect(newState.zipper.row.selection[0].style.cancel).toEqual(-2);

        // Nested nodes have their cancel id cleared
        expect(
            // @ts-expect-error: we know this is a fraction
            newState.zipper.row.selection[0].children[0].children[0].style
                .cancel,
        ).toBeUndefined();
        expect(
            // @ts-expect-error: we know this is a fraction
            newState.zipper.row.selection[0].children[1].children[0].style
                .cancel,
        ).toBeUndefined();
    });
});
