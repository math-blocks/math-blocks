import * as builders from "../../ast/builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {row, frac} from "../test-util";
import {selectionZipperFromZippers} from "../convert";
import type {Zipper} from "../types";
import {zrow} from "../test-util";

// TODO: add a serializer or custom matcher to help with assertions

describe("moveRight w/ selecting = true", () => {
    describe("simple row", () => {
        test("selects the character to the right", () => {
            const startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selectino from zippers");
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
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selectino from zippers");
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
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selectino from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("tries to select past the start", () => {
            let startZipper: Zipper = {
                row: zrow([], row("1+2").children),
                breadcrumbs: [],
            };
            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selectino from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("tries to select past the end", () => {
            let startZipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selectino from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a row", () => {
        test("moving out of the fraction", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the right from the first breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the right edge of the bottom breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.glyph("+"),
                                builders.glyph("3"),
                            ],
                            [builders.glyph("x")],
                        ),
                        builders.glyph("+"),
                        builders.glyph("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.glyph("+"),
                                builders.glyph("3"),
                            ],
                            [builders.glyph("x")],
                        ),
                        builders.glyph("+"),
                        builders.glyph("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting selection in from the outer fraction", () => {
            let startZipper: Zipper = {
                row: zrow(
                    [],
                    builders.row([
                        builders.frac(
                            [
                                frac("1", "2"),
                                builders.glyph("+"),
                                builders.glyph("3"),
                            ],
                            [builders.glyph("x")],
                        ),
                        builders.glyph("+"),
                        builders.glyph("4"),
                    ]).children,
                ),
                breadcrumbs: [],
            };

            startZipper = moveRight(startZipper);
            startZipper = moveRight(startZipper);
            let endZipper = startZipper;
            endZipper = moveRight(startZipper, endZipper); // select '1'
            endZipper = moveRight(startZipper, endZipper); // select '1/2' fraction
            endZipper = moveRight(startZipper, endZipper); // select '+'
            endZipper = moveRight(startZipper, endZipper); // select '3'
            endZipper = moveRight(startZipper, endZipper); // select 'x'
            endZipper = moveLeft(startZipper, endZipper); // de-select 'x'

            const result = selectionZipperFromZippers(startZipper, endZipper);

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

            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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

            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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

            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // 2/3
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // 2/3
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the left from the first breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection).toHaveLength(2);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("selecting to the left edge of the bottom breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(3); // all nodes
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });

        test("move back to the starting location", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.frac(
                            [builders.glyph("x")],
                            [
                                builders.glyph("2"),
                                builders.glyph("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '2', '+'
            expect(result.row.selection).toHaveLength(1); // 3/4
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
        });

        test("expanding selection out of the outer fraction", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.frac(
                            [builders.glyph("x")],
                            [
                                builders.glyph("2"),
                                builders.glyph("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

            if (!result) {
                throw new Error("Can't create selection from zippers");
            }

            expect(result.row.left).toHaveLength(2); // '1', '+'
            expect(result.row.selection).toHaveLength(1); // (2 + 3/4) / x
            expect(result.row.right).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(0);
        });

        test("constricting selection in from the outer fraction", () => {
            let startZipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.frac(
                            [builders.glyph("x")],
                            [
                                builders.glyph("2"),
                                builders.glyph("+"),
                                frac("3", "4"),
                            ],
                        ),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };

            startZipper = moveLeft(startZipper);
            startZipper = moveLeft(startZipper);
            let endZipper = startZipper;
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveLeft(startZipper, endZipper);
            endZipper = moveRight(startZipper, endZipper);

            const result = selectionZipperFromZippers(startZipper, endZipper);

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
