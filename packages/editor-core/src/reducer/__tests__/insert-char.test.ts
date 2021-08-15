import * as builders from "../../ast/builders";

import {insertChar} from "../insert-char";
import {moveRight} from "../move-right";
import {row, toEqualEditorNodes, zrow} from "../test-util";
import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

describe("insertChar", () => {
    test("it inserts characters at the end", () => {
        const zipper: Zipper = {
            row: zrow(row("1+").children, []),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = insertChar(state, "2");

        expect(result.row.left).toEqualEditorNodes(row("1+2").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it inserts characters at the start", () => {
        const zipper: Zipper = {
            row: zrow([], row("+2").children),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = insertChar(state, "1");

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("+2").children);
    });

    test("it inserts characters in the middle", () => {
        const zipper: Zipper = {
            row: zrow([builders.char("1")], [builders.char("2")]),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = insertChar(state, "+");

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it inserts 'limits' characters", () => {
        const zipper: Zipper = {
            row: zrow(row("1+").children, []),
            breadcrumbs: [],
        };
        const state: State = {
            startZipper: zipper,
            endZipper: zipper,
            zipper: zipper,
            selecting: false,
        };

        const {startZipper: result} = insertChar(state, "\u03a3"); // \sum

        expect(result.row.left).toEqualEditorNodes(
            builders.row([
                builders.char("1"),
                builders.char("+"),
                builders.limits(builders.char("\u03a3"), [], []),
            ]).children,
        );
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    describe("selections", () => {
        test("replace selection in zipper.row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.char("1")],
                    selection: [],
                    right: [builders.char("+"), builders.char("2")],
                    style: {},
                },
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: true,
            };
            state = moveRight(state);

            const {startZipper: result} = insertChar(state, "\u2122");

            expect(result.row.left).toEqualEditorNodes(row("1\u2122").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("inserts 'limits' character before selection", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.char("1")],
                    selection: [],
                    right: [builders.char("+"), builders.char("2")],
                    style: {},
                },
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: true,
            };

            state = moveRight(state);

            const {startZipper: result} = insertChar(state, "\u03a3"); // \sum

            expect(result.row.left).toEqualEditorNodes(
                builders.row([
                    builders.char("1"),
                    builders.limits(builders.char("\u03a3"), [], []),
                    builders.char("+"),
                ]).children,
            );
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });
    });
});
