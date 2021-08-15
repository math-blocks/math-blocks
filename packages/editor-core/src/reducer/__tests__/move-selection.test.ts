import * as builders from "../../char/builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {row, frac} from "../test-util";
import {selectionZipperFromZippers} from "../convert";
import type {Zipper, State} from "../types";
import {zrow} from "../test-util";

// TODO: add a serializer or custom matcher to help with assertions

describe("moveRight w/ selecting = true", () => {
    describe("simple row", () => {
        test("selects the character to the right", () => {
            const startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveRight(state);
            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("selects multiple characters to the right", () => {
            const startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(state));
            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
        });

        test("constricting selection to the left", () => {
            const startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveLeft(moveRight(moveRight(state)));
            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("tries to select past the start", () => {
            const startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("tries to select past the end", () => {
            const startZipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a row", () => {
        test("moving out of the fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(moveRight(state));
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(state);

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the right from the first breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(moveRight(state)));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the right edge of the bottom breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveRight(moveRight(moveRight(state))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(moveRight(moveRight(moveRight(state)))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            // We're inside the fraction
            expect(result.breadcrumbs[0].row.left).toHaveLength(0);
            expect(result.breadcrumbs[0].row.right).toHaveLength(2);
        });

        test("move back to the starting location", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.char("+"),
                        builders.char("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(state);
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(
                moveLeft(moveLeft(moveRight(moveRight(moveRight(state))))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.right).toHaveLength(1);
            expect(result.row.selection).toHaveLength(0);
            expect(result.row.left).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });
    });

    describe("frac in a frac", () => {
        test("expanding selection out of the inner fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.char("+"),
                                builders.char("3"),
                            ],
                            [builders.char("x")],
                        ),
                        builders.char("+"),
                        builders.char("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(moveRight(state));
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.left).toHaveLength(0);
            expect(result.breadcrumbs[0].row.right).toHaveLength(2);
        });

        test("expanding selection out of the outer fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.char("+"),
                                builders.char("3"),
                            ],
                            [builders.char("x")],
                        ),
                        builders.char("+"),
                        builders.char("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(moveRight(state));
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(
                moveRight(moveRight(moveRight(moveRight(state)))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting selection in from the outer fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.char("+"),
                                builders.char("3"),
                            ],
                            [builders.char("x")],
                        ),
                        builders.char("+"),
                        builders.char("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveRight(moveRight(state));
            state = {
                ...state,
                endZipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(
                moveRight(moveRight(moveRight(moveRight(moveRight(state))))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });
    });
});

describe("moveLeft w/ selecting = true", () => {
    describe("simple row", () => {
        test("selects the character to the right", () => {
            const startZipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveLeft(state);

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });

        test("selects multiple characters to the right", () => {
            const startZipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(0);
        });

        test("constricting selection to the right", () => {
            const startZipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: true,
            };
            state = moveRight(moveLeft(moveLeft(state)));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a row", () => {
        test("moving out of the fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // 2/3
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(state);

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // 2/3
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the left from the first breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(moveLeft(state)));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the left edge of the bottom breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(moveLeft(moveLeft(state))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3); // all nodes
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveLeft(moveLeft(moveLeft(state))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(moveRight(moveLeft(moveLeft(moveLeft(state)))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });

        test("move back to the starting location", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(
                moveRight(moveRight(moveLeft(moveLeft(moveLeft(state))))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection).toHaveLength(0);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a frac", () => {
        test("expanding selection out of the inner fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        builders.frac(
                            [builders.char("x")],
                            [
                                builders.char("2"),
                                builders.char("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(state));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '2', '+'
            expect(result.row.selection).toHaveLength(1); // 3/4
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });

        test("expanding selection out of the outer fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        builders.frac(
                            [builders.char("x")],
                            [
                                builders.char("2"),
                                builders.char("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(moveLeft(moveLeft(moveLeft(state)))));

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // (2 + 3/4) / x
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting selection in from the outer fraction", () => {
            const startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.char("1"),
                        builders.char("+"),
                        builders.frac(
                            [builders.char("x")],
                            [
                                builders.char("2"),
                                builders.char("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveRight(
                moveLeft(moveLeft(moveLeft(moveLeft(moveLeft(state))))),
            );

            const result = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3); // 2 + 3/4
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });
    });
});
