import * as Semantic from "@math-blocks/semantic";

import {backspace} from "../backspace";
import {row} from "../test-util";
import * as types from "../../types";

import {Zipper} from "../types";

const toEqualEditorNodes = (
    received: types.Node[],
    actual: types.Node[],
): {message: () => string; pass: boolean} => {
    const message = "Editor nodes didn't match";
    if (Semantic.util.deepEquals(received, actual)) {
        return {
            message: () => message,
            pass: true,
        };
    }
    return {
        message: () => message,
        pass: false,
    };
};

expect.extend({toEqualEditorNodes});

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualEditorNodes(actual: types.Node[]): R;
        }
    }
    /* eslint-enable */
}

describe("backspace", () => {
    test("it deletes characters at the end", () => {
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

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it deletes characters in the middle", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                left: row("1+").children,
                selection: null,
                right: row("2").children,
            },
            breadcrumbs: [],
        };

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    test("it does nothing at the start", () => {
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

        const result = backspace(zipper);

        expect(result.row.left).toEqualEditorNodes(row("").children);
        expect(result.row.right).toEqualEditorNodes(row("1+2").children);
    });

    describe("fractions", () => {
        test("deleting from the start of the numerator", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // numerator
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            dir: "left", // the numerator is focused
                            other: row("3"), // denominator
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("23").children);
        });

        test("deleting from the start of the denominator", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("3").children, // denominator
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zfrac",
                            dir: "right", // the denominator is focused
                            other: row("2"), // numerator
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+2").children);
            expect(result.row.right).toEqualEditorNodes(row("3").children);
        });

        test.todo(
            "deleting from the right of the fraction moves into the denonominator",
        );
    });

    describe("subsup", () => {
        test("deleting from the start of the subscript w/o a superscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // subscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: "left", // the subscript is focused
                            other: null, // no superscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n").children);
        });

        test("deleting from the start of the subscript with a superscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // sbuscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: "left", // the subscript is focused
                            other: row("2"), // superscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("n2").children);
        });

        test("deleting from the start of the superscript w/o a subscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // superscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: "right", // the superscript is focused
                            other: null, // no subscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("x").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("deleting from the start of the superscript with a subscript", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("2").children, // superscript
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("x").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zsubsup",
                            dir: "right", // the superscript is focused
                            other: row("n"), // subscript
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("xn").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test.todo("deleting from the right of a subscript");
        test.todo("deleting from the right of a superscript");
    });

    describe("roots", () => {
        test("deleting from the start of a radicand w/o an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("27").children, // index
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: "right", // the radicand is focused
                            other: null, // no index
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of a radicand with an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("27").children, // index
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: "right", // the radicand is focused
                            other: row("3"), // index
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+3").children);
            expect(result.row.right).toEqualEditorNodes(row("27").children);
        });

        test("deleting from the start of an index", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("3").children,
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: row("1+").children,
                            selection: null,
                            right: [],
                        },
                        focus: {
                            id: 0,
                            type: "zroot",
                            dir: "left", // the index is focused
                            other: row("27"), // radicand
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("1+").children);
            expect(result.row.right).toEqualEditorNodes(row("327").children);
        });

        test.todo("deleting from the right of a root w/o an index");
        test.todo("deleting from the right of a root with an index");
    });

    describe("limits", () => {
        test("deleting from the start of the lower bound w/o an upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("x->0").children, // lower bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("x").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: "left", // the lower bound is focused
                            other: null, // no upper bound
                            inner: row("lim"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("x->0x").children);
        });

        test("deleting from the start of the bound limit with an upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("i=0").children, // lower bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("i").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: "left", // the lower bound is focused
                            other: row("n"), // upper bound
                            inner: row("sum"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("i=0ni").children);
        });

        test("deleting from the start of the upper bound", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row("n").children, // upper bound
                },
                breadcrumbs: [
                    {
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [],
                            selection: null,
                            right: row("i").children,
                        },
                        focus: {
                            id: 0,
                            type: "zlimits",
                            dir: "right", // the upper bound is focused
                            other: row("i=0"), // lower bound
                            inner: row("sum"),
                        },
                    },
                ],
            };

            const result = backspace(zipper);

            expect(result.row.left).toEqualEditorNodes(row("i=0").children);
            expect(result.row.right).toEqualEditorNodes(row("ni").children);
        });

        test.todo(
            "deleting from the right of a limits node w/o an upper bound",
        );
        test.todo(
            "deleting from the right of a limits node with an upper bound",
        );
    });

    describe("parens", () => {
        describe("no pending parens", () => {
            test.todo("deleting the right paren should change it to pending");
            test.todo("deleting the left paren should change it to pending");
        });

        describe("pending parens", () => {
            test.todo(
                "deleting the right non-pending paren should delete both parens",
            );
            test.todo(
                "deleting the left non-pending paren should delete both parens",
            );
        });
    });
});
