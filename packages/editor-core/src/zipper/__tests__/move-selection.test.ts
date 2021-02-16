import * as builders from "../../builders";

import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {row, frac} from "../test-util";
import {Dir} from "../enums";
import type {Zipper} from "../types";

// TODO: add a serializer or custom matcher to help with assertions

describe("moveRight w/ selecting = true", () => {
    describe("simple row", () => {
        test("selects the character to the right", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("1+2").children,
                },
                breadcrumbs: [],
            };

            const result = moveRight(zipper, true);

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });

        test("selects multiple characters to the right", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("1+2").children,
                },
                breadcrumbs: [],
            };

            const result = moveRight(moveRight(zipper, true), true);

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(2);
            expect(result.row.right).toHaveLength(1);
        });

        test("constricting selection to the left", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("1+2").children,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveRight(moveRight(zipper, true), true),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.row.right).toHaveLength(2);
        });
    });

    describe("frac in a row", () => {
        test("moving out of the fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(moveRight(moveRight(zipper), true), true);

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.right).toHaveLength(2);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(moveRight(moveRight(zipper)), true);

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.right).toHaveLength(2);
        });

        test("selecting to the right from the first breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(zipper), true), true),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(1); // focus is selected
            expect(result.breadcrumbs[0].row.right).toHaveLength(1);
        });

        test("selecting to the right edge of the bottom breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(
                    moveRight(
                        moveRight(moveRight(moveRight(zipper), true), true),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[0].row.right).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveRight(
                    moveRight(moveRight(moveRight(zipper), true), true),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.right).toHaveLength(2);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(
                    moveRight(
                        moveRight(moveRight(moveRight(zipper), true), true),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });

        test("move back to the starting location", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
                        frac("1", "2"),
                        builders.glyph("+"),
                        builders.glyph("3"),
                    ]).children,
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(
                    moveLeft(
                        moveRight(
                            moveRight(moveRight(moveRight(zipper), true), true),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.right).toHaveLength(1);
            expect(result.row.selection).toBeNull();
            expect(result.row.left).toHaveLength(0);
        });
    });

    describe("frac in a frac", () => {
        test("expanding selection out of the inner fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(moveRight(moveRight(zipper)), true),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[1].row.right).toHaveLength(2);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });

        test("expanding selection out of the outer fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(
                    moveRight(
                        moveRight(
                            moveRight(moveRight(moveRight(zipper)), true),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[1].row.right).toHaveLength(0);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
        });

        test("constricting selection in from the outer fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    right: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveRight(
                    moveRight(
                        moveRight(
                            moveRight(
                                moveRight(moveRight(moveRight(zipper)), true),
                                true,
                            ),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Right);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Right);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[1].row.right).toHaveLength(0);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });
    });
});

describe("moveLeft w/ selecting = true", () => {
    describe("simple row", () => {
        test("selects the character to the right", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(zipper, true);

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });

        test("selects multiple characters to the right", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(moveLeft(zipper, true), true);

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(2);
            expect(result.row.right).toHaveLength(0);
        });

        test("constricting selection to the right", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveLeft(moveLeft(zipper, true), true),
                true,
            );

            expect(result.row.left).toHaveLength(2);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a row", () => {
        test("moving out of the fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper), true), true);

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.left).toHaveLength(2);
        });

        test("moving out of the fraction (starting at the edge)", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(moveLeft(moveLeft(zipper)), true);

            expect(result.row.right).toHaveLength(1);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.left).toHaveLength(2);
        });

        test("selecting to the left from the first breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(zipper), true), true),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(1); // focus is selected
            expect(result.breadcrumbs[0].row.left).toHaveLength(1);
        });

        test("selecting to the left edge of the bottom breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(
                    moveLeft(moveLeft(moveLeft(moveLeft(zipper)), true), true),
                    true,
                ),
                true,
            );

            expect(result.row.right).toHaveLength(1);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(0);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[0].row.left).toHaveLength(0);
        });

        test("constricting the selection to the left from the first breadcrumb", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveLeft(
                    moveLeft(moveLeft(moveLeft(zipper), true), true),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[0].row.left).toHaveLength(2);
        });

        test("constricting the selection from first breadcrumb back into starting row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(
                    moveLeft(
                        moveLeft(moveLeft(moveLeft(zipper), true), true),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });

        test("move back to the starting location", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        frac("2", "3"),
                    ]).children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveRight(
                    moveRight(
                        moveLeft(
                            moveLeft(moveLeft(moveLeft(zipper), true), true),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(1);
            expect(result.row.selection).toBeNull();
            expect(result.row.right).toHaveLength(0);
        });
    });

    describe("frac in a frac", () => {
        test("expanding selection out of the inner fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    right: [],
                    left: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(moveLeft(moveLeft(zipper)), true),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(0); // focus is selected
            expect(result.breadcrumbs[1].row.left).toHaveLength(2);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });

        test("expanding selection out of the outer fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    right: [],
                    left: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveLeft(
                moveLeft(
                    moveLeft(
                        moveLeft(
                            moveLeft(moveLeft(moveLeft(zipper)), true),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[1].row.left).toHaveLength(0);
            expect(result.breadcrumbs[0].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[0].row.selection?.nodes).toHaveLength(0); // focus is selected
        });

        test("constricting selection in from the outer fraction", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    right: [],
                    left: builders.row([
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
                    selection: null,
                },
                breadcrumbs: [],
            };

            const result = moveRight(
                moveLeft(
                    moveLeft(
                        moveLeft(
                            moveLeft(
                                moveLeft(moveLeft(moveLeft(zipper)), true),
                                true,
                            ),
                            true,
                        ),
                        true,
                    ),
                    true,
                ),
                true,
            );

            expect(result.row.left).toHaveLength(0);
            expect(result.row.selection?.dir).toEqual(Dir.Left);
            expect(result.row.selection?.nodes).toHaveLength(1);
            expect(result.breadcrumbs).toHaveLength(2);
            expect(result.breadcrumbs[1].row.selection?.dir).toEqual(Dir.Left);
            expect(result.breadcrumbs[1].row.selection?.nodes).toHaveLength(2); // focus is selected
            expect(result.breadcrumbs[1].row.left).toHaveLength(0);
            expect(result.breadcrumbs[0].row.selection).toBeNull();
        });
    });
});
