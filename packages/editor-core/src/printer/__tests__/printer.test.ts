import {getId} from "@math-blocks/core";
import * as Semantic from "@math-blocks/semantic";

import * as builders from "../../char/builders";
import * as types from "../../char/types";
import * as Util from "../../char/util";
import {toEqualEditorNode} from "../../test-util";
import {textRepsToTable} from "../../reducer/vertical-work/test-util";

import {print} from "../printer";

expect.extend({toEqualEditorNode});

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualEditorNode(actual: types.CharNode): R;
        }
    }
    /* eslint-enable */
}

describe("print", () => {
    test("123", () => {
        const ast = Semantic.builders.number("123");

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("123"));
    });

    test("1", () => {
        const ast = Semantic.builders.number("1");

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("1"));
    });

    test("1+2+3", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.number("1"),
            Semantic.builders.number("2"),
            Semantic.builders.number("3"),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("1+2+3"));
    });

    test("12+34", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.number("12"),
            Semantic.builders.number("34"),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("12+34"));
    });

    test("a*b*c", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.identifier("a"),
                Semantic.builders.identifier("b"),
                Semantic.builders.identifier("c"),
            ],
            false,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("a\u00B7b\u00B7c"));
    });

    test("abc", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.identifier("a"),
                Semantic.builders.identifier("b"),
                Semantic.builders.identifier("c"),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("abc"));
    });

    test("5y", () => {
        const ast = Semantic.builders.mul(
            [Semantic.builders.number("5"), Semantic.builders.identifier("y")],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("5y"));
    });

    test("abc+123", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.mul(
                [
                    Semantic.builders.identifier("a"),
                    Semantic.builders.identifier("b"),
                    Semantic.builders.identifier("c"),
                ],
                true,
            ),
            Semantic.builders.number("123"),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("abc+123"));
    });

    test("a(x+y)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.identifier("a"),
                Semantic.builders.add([
                    Semantic.builders.identifier("x"),
                    Semantic.builders.identifier("y"),
                ]),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.char("a"),
                builders.delimited(
                    [
                        builders.char("x"),
                        builders.char("+"),
                        builders.char("y"),
                    ],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("-1(2x)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.neg(Semantic.builders.number("1")),
                Semantic.builders.mul(
                    [
                        Semantic.builders.number("2"),
                        Semantic.builders.identifier("x"),
                    ],
                    true,
                ),
            ],
            true,
        );

        const node = print(ast);

        expect(
            Semantic.util.deepEquals(
                node,
                builders.row([
                    builders.delimited(
                        [builders.char("\u2212"), builders.char("1")],
                        builders.char("("),
                        builders.char(")"),
                    ),
                    builders.delimited(
                        [builders.char("2"), builders.char("x")],
                        builders.char("("),
                        builders.char(")"),
                    ),
                ]),
            ),
        ).toBeTruthy();
    });

    test("(1)(2)(3)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.number("1"),
                Semantic.builders.number("2"),
                Semantic.builders.number("3"),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [builders.char("1")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [builders.char("2")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [builders.char("3")],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("(-a)(-b)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.neg(Semantic.builders.identifier("a")),
                Semantic.builders.neg(Semantic.builders.identifier("b")),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [builders.char("\u2212"), builders.char("a")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [builders.char("\u2212"), builders.char("b")],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("(a/b)(c/d)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.div(
                    Semantic.builders.identifier("a"),
                    Semantic.builders.identifier("b"),
                ),
                Semantic.builders.div(
                    Semantic.builders.identifier("c"),
                    Semantic.builders.identifier("d"),
                ),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [Util.frac("a", "b")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [Util.frac("c", "d")],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("a/b * c/d", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.div(
                    Semantic.builders.identifier("a"),
                    Semantic.builders.identifier("b"),
                ),
                Semantic.builders.div(
                    Semantic.builders.identifier("c"),
                    Semantic.builders.identifier("d"),
                ),
            ],
            false,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                Util.frac("a", "b"),
                builders.char("\u00B7"),
                Util.frac("c", "d"),
            ]),
        );
    });

    test("-1.2", () => {
        const ast = Semantic.builders.number("-1.2");

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("-1.2"));
    });

    test("x-y", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("x"),
            Semantic.builders.neg(
                Semantic.builders.identifier("y"),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("x-y"));
    });

    test("a+(b+c)", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("a"),
            Semantic.builders.add([
                Semantic.builders.identifier("b"),
                Semantic.builders.identifier("c"),
            ]),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.char("a"),
                builders.char("+"),
                builders.delimited(
                    [
                        builders.char("b"),
                        builders.char("+"),
                        builders.char("c"),
                    ],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("a-(b+c)", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("a"),
            Semantic.builders.neg(
                Semantic.builders.add([
                    Semantic.builders.identifier("b"),
                    Semantic.builders.identifier("c"),
                ]),
                true, // subtraction
            ),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.char("a"),
                builders.char("\u2212"),
                builders.delimited(
                    [
                        builders.char("b"),
                        builders.char("+"),
                        builders.char("c"),
                    ],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("a/b", () => {
        const ast = Semantic.builders.div(
            Semantic.builders.identifier("a"),
            Semantic.builders.identifier("b"),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(builders.row([Util.frac("a", "b")]));
    });

    test("(a+b)/(x+y)", () => {
        const ast = Semantic.builders.div(
            Semantic.builders.add([
                Semantic.builders.identifier("a"),
                Semantic.builders.identifier("b"),
            ]),
            Semantic.builders.add([
                Semantic.builders.identifier("x"),
                Semantic.builders.identifier("y"),
            ]),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(builders.row([Util.frac("a+b", "x+y")]));
    });

    test("a + -a", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("a"),
            Semantic.builders.neg(Semantic.builders.identifier("a"), false),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("a+-a"));
    });

    test("a + --b", () => {
        const ast = Semantic.builders.add([
            Semantic.builders.identifier("a"),
            Semantic.builders.neg(
                Semantic.builders.neg(Semantic.builders.identifier("b"), false),
                false,
            ),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("a+--b"));
    });

    test("-1(a + b)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.neg(Semantic.builders.number("1")),
                Semantic.builders.add([
                    Semantic.builders.identifier("a"),
                    Semantic.builders.identifier("b"),
                ]),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.char("\u2212"),
                builders.char("1"),
                builders.delimited(
                    [
                        builders.char("a"),
                        builders.char("+"),
                        builders.char("b"),
                    ],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("leading subtraction", () => {
        const ast = {
            type: "add",
            id: 0,
            args: [
                {
                    type: "neg",
                    id: 1,
                    subtraction: true,
                    arg: {type: "identifier", name: "a", id: 2},
                },
                {type: "identifier", name: "b", id: 3},
            ],
        } as const;

        expect(print(ast)).toEqualEditorNode(Util.row("-a+b"));
    });

    test("(a)(b)(1)", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.identifier("a"),
                Semantic.builders.identifier("b"),
                Semantic.builders.number("1"),
            ],
            true,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [builders.char("a")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [builders.char("b")],
                    builders.char("("),
                    builders.char(")"),
                ),
                builders.delimited(
                    [builders.char("1")],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    test("a*b*1", () => {
        const ast = Semantic.builders.mul(
            [
                Semantic.builders.identifier("a"),
                Semantic.builders.identifier("b"),
                Semantic.builders.number("1"),
            ],
            false,
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("a\u00B7b\u00B71"));
    });

    test("y = x + 1", () => {
        const ast = Semantic.builders.eq([
            Semantic.builders.identifier("y"),
            Semantic.builders.add([
                Semantic.builders.identifier("x"),
                Semantic.builders.number("1"),
            ]),
        ]);

        const node = print(ast);

        expect(node).toEqualEditorNode(Util.row("y=x+1"));
    });

    test("x^2", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.identifier("x"),
            Semantic.builders.number("2"),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([builders.char("x"), Util.sup("2")]),
        );
    });

    test("1^n", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.number("1"),
            Semantic.builders.identifier("n"),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([builders.char("1"), Util.sup("n")]),
        );
    });

    test("e^(x+y)", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.identifier("e"),
            Semantic.builders.add([
                Semantic.builders.identifier("x"),
                Semantic.builders.identifier("y"),
            ]),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([builders.char("e"), Util.sup("x+y")]),
        );
    });

    test("(x+1)^2", () => {
        const ast = Semantic.builders.pow(
            Semantic.builders.add([
                Semantic.builders.identifier("x"),
                Semantic.builders.number("1"),
            ]),
            Semantic.builders.number("2"),
        );

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [
                        builders.char("x"),
                        builders.char("+"),
                        builders.char("1"),
                    ],
                    builders.char("("),
                    builders.char(")"),
                ),
                Util.sup("2"),
            ]),
        );
    });

    test("(x)", () => {
        const ast = Semantic.builders.parens(Semantic.builders.identifier("x"));

        const node = print(ast);

        expect(node).toEqualEditorNode(
            builders.row([
                builders.delimited(
                    [builders.char("x")],
                    builders.char("("),
                    builders.char(")"),
                ),
            ]),
        );
    });

    // TODO: add some roundtrip tests as well where we parse and the print and compare
    describe("VerticalWork", () => {
        // TODO: create Semantic.builders.vertAdd() to help with writing tests
        test("actions and before values at the start", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        Semantic.builders.identifier("x"),
                        Semantic.builders.number("2"),
                    ],
                    right: [Semantic.builders.number("5")],
                },
                actions: {
                    left: [Semantic.builders.identifier("x"), null],
                    right: [
                        Semantic.builders.neg(
                            Semantic.builders.number("5"),
                            true,
                        ),
                    ],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " |x|+|2|=|      |5",
                "+|x| | | |\u2212|5",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("negative numbers at the start of a row", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        Semantic.builders.neg(
                            Semantic.builders.identifier("x"),
                            false,
                        ),
                        Semantic.builders.number("2"),
                    ],
                    right: [Semantic.builders.number("5")],
                },
                actions: {
                    left: [Semantic.builders.identifier("x"), null],
                    right: [null],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " |\u2212x|+|2|=|5",
                "+|      x| | | | ",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("actions before and after start row", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [null, Semantic.builders.number("1")],
                    right: [Semantic.builders.number("5"), null],
                },
                actions: {
                    left: [Semantic.builders.identifier("x"), null],
                    right: [null, Semantic.builders.identifier("y")],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(" | |1|=|5| | ", "x|+| | | |+|y");
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("actions before start row and aligned with items in start row", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        null,
                        Semantic.builders.number("1"),
                        Semantic.builders.identifier("y"),
                    ],
                    right: [Semantic.builders.number("5"), null],
                },
                actions: {
                    left: [
                        Semantic.builders.identifier("x"),
                        null,
                        Semantic.builders.identifier("y"),
                    ],
                    right: [null, Semantic.builders.identifier("y")],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " | |1|+|y|=|5| | ",
                "x|+| |+|y| | |+|y",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("actions before start row and cells in next column aligned", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [null, Semantic.builders.number("1")],
                    right: [null, Semantic.builders.number("1")],
                },
                actions: {
                    left: [
                        Semantic.builders.identifier("x"),
                        Semantic.builders.number("2"),
                    ],
                    right: [
                        Semantic.builders.identifier("x"),
                        Semantic.builders.neg(
                            Semantic.builders.number("2"),
                            true,
                        ),
                    ],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " | |1|=| |      |1",
                "x|+|2| |x|\u2212|2",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("more terms", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        null,
                        Semantic.builders.number("1"),
                        Semantic.builders.number("2"),
                    ],
                    right: [Semantic.builders.number("5"), null, null],
                },
                actions: {
                    left: [Semantic.builders.identifier("x"), null, null],
                    right: [
                        null,
                        Semantic.builders.identifier("y"),
                        Semantic.builders.identifier("z"),
                    ],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " | |1|+|2|=|5| | | | ",
                "x|+| | | | | |+|y|+|z",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("more interleaving", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        null,
                        Semantic.builders.number("1"),
                        null,
                        Semantic.builders.number("2"),
                    ],
                    right: [Semantic.builders.number("5")],
                },
                actions: {
                    left: [
                        Semantic.builders.identifier("x"),
                        null,
                        Semantic.builders.number("3"),
                        null,
                    ],
                    right: [null],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " | |1| | |+|2|=|5",
                "x|+| |+|3| | | | ",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("three rows", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        Semantic.builders.mul(
                            [
                                Semantic.builders.number("2"),
                                Semantic.builders.identifier("x"),
                            ],
                            true,
                        ),
                    ],
                    right: [Semantic.builders.number("5")],
                },
                actions: {
                    left: [null],
                    right: [
                        Semantic.builders.neg(
                            Semantic.builders.number("5"),
                            true,
                        ),
                    ],
                },
                after: {
                    left: [
                        Semantic.builders.mul(
                            [
                                Semantic.builders.number("2"),
                                Semantic.builders.identifier("x"),
                            ],
                            true,
                        ),
                    ],
                    right: [Semantic.builders.number("0")],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                "2x|=|      |5",
                "  | |\u2212|5",
                "2x|=|      |0",
            );
            // expect(result.children[0]).toEqual(table);
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("three rows with leading action term", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        null,
                        Semantic.builders.mul(
                            [
                                Semantic.builders.number("2"),
                                Semantic.builders.identifier("x"),
                            ],
                            true,
                        ),
                    ],
                    right: [Semantic.builders.number("5"), null],
                },
                actions: {
                    left: [Semantic.builders.identifier("y"), null],
                    right: [
                        null,
                        Semantic.builders.neg(
                            Semantic.builders.identifier("x"),
                            true,
                        ),
                    ],
                },
                after: {
                    left: [
                        Semantic.builders.identifier("y"),
                        Semantic.builders.mul(
                            [
                                Semantic.builders.number("2"),
                                Semantic.builders.identifier("x"),
                            ],
                            true,
                        ),
                    ],
                    right: [
                        Semantic.builders.number("5"),
                        Semantic.builders.neg(
                            Semantic.builders.identifier("x"),
                            true,
                        ),
                    ],
                },
            };

            const result = print(vertAdd);

            // TODO: fix this test case, we should have two '\u2212' in the
            // second last column.
            const table = textRepsToTable(
                " | |2x|=|5|      | ",
                "y|+|  | | |\u2212|x",
                "y|+|2x|=|5|\u2212|x",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });

        test("two rows with leading action term", () => {
            const vertAdd: Semantic.types.VertWork = {
                type: "vert-work",
                id: getId(),
                before: {
                    left: [
                        null,
                        Semantic.builders.mul(
                            [
                                Semantic.builders.number("2"),
                                Semantic.builders.identifier("x"),
                            ],
                            true,
                        ),
                    ],
                    right: [Semantic.builders.number("5"), null],
                },
                actions: {
                    left: [Semantic.builders.identifier("y"), null],
                    right: [
                        null,
                        Semantic.builders.neg(
                            Semantic.builders.identifier("x"),
                            true,
                        ),
                    ],
                },
            };

            const result = print(vertAdd);

            const table = textRepsToTable(
                " | |2x|=|5|      | ",
                "y|+|  | | |\u2212|x",
            );
            expect(result.children[0]).toEqualEditorNode(table);
        });
    });
});
