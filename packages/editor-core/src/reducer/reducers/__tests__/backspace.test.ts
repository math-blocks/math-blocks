import {row, glyph, subsup} from "../../../builders";

import reducer, {State} from "../../row-reducer";
import * as Util from "../../util";
import {SUB, SUP, NUMERATOR, DENOMINATOR, RADICAND} from "../../constants";
import {toEqualMath} from "../../test-util";

expect.extend({
    toEqualMath,
});

describe("backspace", () => {
    const action = {type: "Backspace"};

    describe("row", () => {
        it("from the back should delete the last character and the cursor should remain at the end", () => {
            const math = Util.row("1+");
            const cursor = {
                path: [],
                prev: 1,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: Infinity,
            });
        });

        it("from the front should do nothing", () => {
            const math = Util.row("1+");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1+"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
        });
    });

    describe("subsup", () => {
        it("from the back should delete the last character in the sup", () => {
            const x = glyph("x");
            const math = row([glyph("e"), subsup(undefined, [x])]);
            const cursor = {
                path: [1, 1],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("e"), subsup(undefined, [])]),
            );

            expect(newState.cursor).toEqual({
                path: [1, 1],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("from the back should delete the last character in the sub", () => {
            const x = glyph("x");
            const math = row([glyph("e"), subsup([x], undefined)]);
            const cursor = {
                path: [1, 0],
                prev: 0,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("e"), subsup([], undefined)]),
            );

            expect(newState.cursor).toEqual({
                path: [1, 0],
                prev: -Infinity,
                next: Infinity,
            });
        });

        it("should delete the sup after if there are no children", () => {
            const math = row([glyph("e"), subsup([], undefined), glyph("g")]);
            const cursor = {
                path: [1, 0],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("eg"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should delete the sub after if there are no children", () => {
            const math = row([glyph("e"), subsup(undefined, []), glyph("g")]);
            const cursor = {
                path: [1, 1],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("eg"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should move into the sub from the right", () => {
            const math = row([glyph("e"), Util.sub("x+y"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);

            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 2,
                next: Infinity,
            });
        });

        it("should move into the sup from the right", () => {
            const math = row([glyph("e"), Util.sup("x+y"), glyph("g")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);

            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 2,
                next: Infinity,
            });
        });

        it("should move into the subsup from the right", () => {
            const math = row([
                glyph("e"),
                Util.subsup("x+y", "a+b"),
                glyph("g"),
            ]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);

            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 2,
                next: Infinity,
            });
        });

        it("should move the sub into the parent when deleting from the front", () => {
            const math = row([glyph("e"), Util.sub("x+y"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("ex+yg"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should move the sup into the parent when deleting from the front", () => {
            const math = row([glyph("e"), Util.sup("x+y"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("ex+yg"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should move the sub into the parent when deleting from the front of the sub", () => {
            const math = row([glyph("e"), Util.subsup("a", "b"), glyph("g")]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("e"), glyph("a"), Util.sup("b"), glyph("g")]),
            );

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should move the sup into the parent when deleting from the front of the sup", () => {
            const math = row([glyph("e"), Util.subsup("a", "b"), glyph("g")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("e"), Util.sub("a"), glyph("b"), glyph("g")]),
            );

            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        test("deleting a sup at the end of an expression resulting in an empty expression", () => {
            const math = row([Util.sup("")]);
            const cursor = {
                path: [0, SUP],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row(""));
            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: Infinity,
            });
        });

        test("deleting a sup at the end of an expression", () => {
            const math = row([glyph("1"), Util.sup("")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: Infinity,
            });
        });

        test("deleting a sub at the end of an expression", () => {
            const math = row([glyph("1"), Util.sub("")]);
            const cursor = {
                path: [1, SUB],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: Infinity,
            });
        });

        test("deleting a subsp at the end of an expression", () => {
            const math = row([glyph("1"), Util.subsup("2", "")]);
            const cursor = {
                path: [1, SUP],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(row([glyph("1"), Util.sub("2")]));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: Infinity,
            });
        });
    });

    describe("frac", () => {
        test("from right enters denominator", () => {
            const math = row([glyph("1"), Util.frac("ab", "cd"), glyph("2")]);
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, DENOMINATOR],
                prev: 1,
                next: Infinity,
            });
        });

        test("deleting from the start of the denominator", () => {
            const math = row([glyph("1"), Util.frac("ab", "cd"), glyph("2")]);
            const cursor = {
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1abcd2"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: 3,
            });
        });

        test("deleting from the start of the numerator", () => {
            const math = row([glyph("1"), Util.frac("ab", "cd"), glyph("2")]);
            const cursor = {
                path: [1, NUMERATOR],
                prev: -Infinity,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1abcd2"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        test("deleting a frac at the end of an expression", () => {
            const math = row([glyph("1"), Util.frac("ab", "")]);
            const cursor = {
                path: [1, DENOMINATOR],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1ab"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: Infinity,
            });
        });

        test("deleting a frac at the end of an expression resulting in an empty expression", () => {
            const math = row([Util.frac("", "")]);
            const cursor = {
                path: [0, DENOMINATOR],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row(""));
            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: Infinity,
            });
        });
    });

    describe("parens", () => {
        test("should move into the parens from the right and set ')' to be pending", () => {
            const math = Util.row("2(x+y)");
            const cursor = {
                path: [],
                prev: 5,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            const newMath = Util.row("2(x+y)");
            if (newMath.children[5].type === "atom") {
                newMath.children[5].value.pending = true;
            }
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 4,
                next: 5,
            });
        });

        test("should delete the ')' and append a pending ')' to the end of the row", () => {
            const math = Util.row("a(x+y)b");
            const cursor = {
                path: [],
                prev: 5,
                next: 6,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            const newMath = Util.row("a(x+yb)");
            if (newMath.children[6].type === "atom") {
                newMath.children[6].value.pending = true;
            }
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 4,
                next: 5,
            });
        });

        test("from the back should delete the last character and the cursor should remain at the end", () => {
            const math = Util.row("2(x+y)");
            const cursor = {
                path: [],
                prev: 3,
                next: 4,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("2(xy)"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: 3,
            });
        });

        test("from the front should move children into parent", () => {
            const math = Util.row("2(x+y)");
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("2x+y"));

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        describe("nested parens", () => {
            test("should delete the ')' and append a pending ')' to the end of the row", () => {
                const math = Util.row("(a(x+y)b)");
                const cursor = {
                    path: [],
                    prev: 6,
                    next: 7,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                const newMath = Util.row("(a(x+yb))");
                if (newMath.children[7].type === "atom") {
                    newMath.children[7].value.pending = true;
                }
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 5,
                    next: 6,
                });
            });

            test("in-progress parens", () => {
                // TODO: complete this test
            });

            test("deleting an inner opening paren", () => {
                const math = Util.row("(a(x+y)b)");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: 3,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                const newMath = Util.row("(ax+yb)");
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("deleting an outer opening paren", () => {
                const math = Util.row("(a(x+y)b)");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                const newMath = Util.row("a(x+y)b");
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: -Infinity,
                    next: 0,
                });
            });
        });
    });

    describe("root", () => {
        test("deleting from behind a root moves cursor into the root", () => {
            const math = row([glyph("2"), Util.sqrt("x+y")]);
            const cursor = {
                path: [],
                prev: 1,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(math);
            expect(newState.cursor).toEqual({
                path: [1, RADICAND],
                prev: 2,
                next: Infinity,
            });
        });

        test("deleting from front of root move children into parent", () => {
            const math = row([glyph("2"), Util.sqrt("x+y")]);
            const cursor = {
                path: [1, RADICAND],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("2x+y"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        test("deleting a root at the end of an expression", () => {
            const math = row([glyph("1"), Util.sqrt("")]);
            const cursor = {
                path: [1, RADICAND],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("1"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: Infinity,
            });
        });

        test("deleting a root at the end of an expression resulting in an empty expression", () => {
            const math = row([Util.sqrt("")]);
            const cursor = {
                path: [0, RADICAND],
                prev: -Infinity,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row(""));
            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: Infinity,
            });
        });
    });
});
