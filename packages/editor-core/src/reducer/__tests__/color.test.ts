import {color} from "../color";
import {moveRight} from "../move-right";

import {row, frac, stateFromZipper} from "../test-util";

import type {Zipper} from "../types";
import {getId} from "@math-blocks/core";

describe("color", () => {
    test("single color region", () => {
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

        const newState = color(state, "blue");

        expect(newState.zipper.row.selection).toHaveLength(3);
        expect(
            newState.zipper.row.selection.every(
                (node) => node.style.color === "blue",
            ),
        ).toBeTruthy();
        expect(
            newState.startZipper.row.right
                .slice(0, 3)
                .every((node) => node.style.color === "blue"),
        ).toBeTruthy();
        expect(
            newState.endZipper.row.left
                .slice(1)
                .every((node) => node.style.color === "blue"),
        ).toBeTruthy();
    });

    test("override existing color", () => {
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
        zipper.row.left.forEach((node) => (node.style.color = "orange"));
        zipper.row.selection.forEach((node) => (node.style.color = "orange"));
        zipper.row.right.forEach((node) => (node.style.color = "orange"));

        const state = stateFromZipper(zipper);

        const newState = color(state, "blue");

        expect(newState.zipper.row.selection).toHaveLength(3);
        expect(
            newState.zipper.row.selection.every(
                (node) => node.style.color === "blue",
            ),
        ).toBeTruthy();

        // Colors on non-selected nodes are left alone
        expect(
            newState.zipper.row.right.every(
                (node) => node.style.color === "orange",
            ),
        ).toBeTruthy();
        expect(
            newState.zipper.row.left.every(
                (node) => node.style.color === "orange",
            ),
        ).toBeTruthy();
    });

    test("two side-by-side color regions", () => {
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
        state = color(state, "blue");
        state = {
            ...state,
            startZipper: state.endZipper,
            zipper: state.endZipper,
        };
        state = moveRight(state);
        state = color(state, "orange");

        expect(state.endZipper.row.left).toHaveLength(2);
        expect(state.endZipper.row.left[0].style.color).toEqual("blue");
        expect(state.endZipper.row.left[1].style.color).toEqual("orange");

        expect(state.zipper.row.left[0].style.color).toEqual("blue");
        expect(state.zipper.row.selection).toHaveLength(1);
        expect(state.zipper.row.selection[0].style.color).toEqual("orange");

        expect(state.startZipper.row.left[0].style.color).toEqual("blue");
        expect(state.startZipper.row.right[0].style.color).toEqual("orange");
    });

    test("all ancestor nodes within the selection get the same color", () => {
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

        const newState = color(state, "blue");

        expect(newState.zipper.row.selection[0].style.color).toEqual("blue");

        // All ancestor nodes get the same color
        expect(
            // @ts-expect-error: we know this is a fraction
            newState.zipper.row.selection[0].children[0].children[0].style
                .color,
        ).toEqual("blue");
        expect(
            // @ts-expect-error: we know this is a fraction
            newState.zipper.row.selection[0].children[1].children[0].style
                .color,
        ).toEqual("blue");
    });
});
