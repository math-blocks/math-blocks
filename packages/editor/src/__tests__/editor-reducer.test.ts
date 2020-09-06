import reducer, {State} from "../above-reducer";
import * as Editor from "../editor-ast";
import * as Util from "../util";
import {SUB, SUP, DENOMINATOR, RADICAND, NUMERATOR} from "../constants";

const {row, glyph} = Editor;

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualMath(actual: Editor.Node<Editor.Glyph, Util.ID>): R;
        }
    }
    /* eslint-enable */
}

describe("reducer", () => {
    describe("selecting", () => {
        test("starting from the left", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
            };

            const action = {type: "ArrowRight", shift: true};

            const newState = reducer(reducer(state, action), action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
            expect(newState.selectionStart).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
        });

        test("starting from the right", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: 2,
                    next: Infinity,
                },
            };

            const action = {type: "ArrowLeft", shift: true};

            const newState = reducer(reducer(state, action), action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
            expect(newState.selectionStart).toEqual({
                path: [],
                prev: 2,
                next: Infinity,
            });
        });

        test("starting from the right, ending in the left", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
                selectionStart: {
                    path: [],
                    prev: 2,
                    next: Infinity,
                },
            };

            const action = {type: "ArrowLeft"};

            const newState = reducer(state, action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("starting from the right, ending in the right", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
                selectionStart: {
                    path: [],
                    prev: 2,
                    next: Infinity,
                },
            };

            const action = {type: "ArrowRight"};

            const newState = reducer(state, action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: Infinity,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("starting from the left, ending in the left", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: 2,
                    next: Infinity,
                },
                selectionStart: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
            };

            const action = {type: "ArrowLeft"};

            const newState = reducer(state, action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: -Infinity,
                next: 0,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("starting from the left, ending in the right", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: 2,
                    next: Infinity,
                },
                selectionStart: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
            };

            const action = {type: "ArrowRight"};

            const newState = reducer(state, action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: 2,
                next: Infinity,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("starting in the middle and going left to start, ending right", () => {
            const state = {
                math: Util.row("1+2"),
                cursor: {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                },
                selectionStart: {
                    path: [],
                    prev: 1,
                    next: 2,
                },
            };

            const action = {type: "ArrowRight"};

            const newState = reducer(state, action);

            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        describe("fractions", () => {
            test("moving out of denominator to left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const action = {type: "ArrowLeft", shift: true};
                const newState = reducer(reducer(state, action), action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(cursor);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            test("moving out of denominator to right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const action = {type: "ArrowRight", shift: true};
                const newState = reducer(reducer(state, action), action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(cursor);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("moving out of numerator to left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const action = {type: "ArrowLeft", shift: true};
                const newState = reducer(reducer(state, action), action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(cursor);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            test("moving out of numerator to right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const action = {type: "ArrowRight", shift: true};
                const newState = reducer(reducer(state, action), action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(cursor);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("moving into denominator from left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const selectionStart = {
                    path: [1, DENOMINATOR],
                    prev: 0,
                    next: 1,
                };
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor, selectionStart};
                const action = {type: "ArrowRight", shift: true};
                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(selectionStart);
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: -Infinity,
                    next: 0,
                });
            });

            test("moving into denominator from right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const selectionStart = {
                    path: [1, DENOMINATOR],
                    prev: 0,
                    next: 1,
                };
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor, selectionStart};
                const action = {type: "ArrowLeft", shift: true};
                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(selectionStart);
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: 1,
                    next: Infinity,
                });
            });

            test("moving into numerator from left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const selectionStart = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: 1,
                };
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor, selectionStart};
                const action = {type: "ArrowRight", shift: true};
                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(selectionStart);
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: -Infinity,
                    next: 0,
                });
            });

            test("moving into numerator from right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const selectionStart = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: 1,
                };
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor, selectionStart};
                const action = {type: "ArrowLeft", shift: true};
                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(math);
                expect(newState.selectionStart).toEqual(selectionStart);
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: 1,
                    next: Infinity,
                });
            });
        });

        // describe.todo("subsup");
    });

    describe("manipulating a selection", () => {
        test("'/' creates a frac with the selection as numerator", () => {
            const math = Util.row("1+2+3");
            const selectionStart = {
                path: [],
                prev: 1,
                next: 2,
            };
            const cursor = {
                path: [],
                prev: 4,
                next: Infinity,
            };

            const state: State = {
                math,
                cursor,
                selectionStart,
            };
            const action = {type: "/"};

            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("1"), glyph("+"), Util.frac("2+3", "")]),
            );
            expect(newState.cursor).toEqual({
                path: [2, DENOMINATOR],
                prev: -Infinity,
                next: Infinity,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        describe("backspace", () => {
            test("deleting the tail of a row", () => {
                const math = Util.row("1+2+3");
                const selectionStart = {
                    path: [],
                    prev: 1,
                    next: 2,
                };
                const cursor = {
                    path: [],
                    prev: 4,
                    next: Infinity,
                };

                const state: State = {
                    math,
                    cursor,
                    selectionStart,
                };
                const action = {type: "Backspace"};

                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(Util.row("1+"));
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: Infinity,
                });
                expect(newState.selectionStart).toBe(undefined);
            });

            test("deleting the head of a row", () => {
                const math = Util.row("1+2+3");
                const selectionStart = {
                    path: [],
                    prev: 1,
                    next: 2,
                };
                const cursor = {
                    path: [],
                    prev: -Infinity,
                    next: 0,
                };

                const state: State = {
                    math,
                    cursor,
                    selectionStart,
                };
                const action = {type: "Backspace"};

                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(Util.row("2+3"));
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: -Infinity,
                    next: 0,
                });
                expect(newState.selectionStart).toBe(undefined);
            });

            test("deleting in the middle", () => {
                const math = Util.row("1+2+3");
                const selectionStart = {
                    path: [],
                    prev: 0,
                    next: 1,
                };
                const cursor = {
                    path: [],
                    prev: 3,
                    next: 4,
                };

                const state: State = {
                    math,
                    cursor,
                    selectionStart,
                };
                const action = {type: "Backspace"};

                const newState = reducer(state, action);

                expect(newState.math).toEqualMath(Util.row("13"));
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
                expect(newState.selectionStart).toBe(undefined);
            });
        });

        test("inserting a new character in the middle", () => {
            const math = Util.row("1+2+3");
            const selectionStart = {
                path: [],
                prev: 0,
                next: 1,
            };
            const cursor = {
                path: [],
                prev: 3,
                next: 4,
            };

            const state: State = {
                math,
                cursor,
                selectionStart,
            };
            const action = {type: "2"};

            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(Util.row("123"));
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("making a selection a superscript", () => {
            const math = Util.row("ex+y");
            const selectionStart = {
                path: [],
                prev: 0,
                next: 1,
            };
            const cursor = {
                path: [],
                prev: 3,
                next: Infinity,
            };

            const state: State = {
                math,
                cursor,
                selectionStart,
            };
            const action = {type: "^"};

            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("e"), Util.sup("x+y")]),
            );
            expect(newState.cursor).toEqual({
                path: [1, SUP],
                prev: 2,
                next: Infinity,
            });
            expect(newState.selectionStart).toBe(undefined);
        });

        test("making a selection a subscript", () => {
            const math = Util.row("an+1");
            const selectionStart = {
                path: [],
                prev: 0,
                next: 1,
            };
            const cursor = {
                path: [],
                prev: 3,
                next: Infinity,
            };

            const state: State = {
                math,
                cursor,
                selectionStart,
            };
            const action = {type: "_"};

            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("a"), Util.sub("n+1")]),
            );
            // e.g. toHaveCursorAtEndOf("sub");
            expect(newState.cursor).toEqual({
                path: [1, SUB],
                prev: 2,
                next: Infinity,
            });
            // e.g. not.toHaveSelection()
            expect(newState.selectionStart).toBe(undefined);
        });

        test("making a selection a square root", () => {
            const math = Util.row("2x+5");
            const selectionStart = {
                path: [],
                prev: 0,
                next: 1,
            };
            const cursor = {
                path: [],
                prev: 3,
                next: Infinity,
            };

            const state: State = {
                math,
                cursor,
                selectionStart,
            };
            const action = {type: "\u221A"};

            const newState = reducer(state, action);

            expect(newState.math).toEqualMath(
                row([glyph("2"), Util.sqrt("x+5")]),
            );
            // e.g. toHaveCursorAtEndOf("sub");
            expect(newState.cursor).toEqual({
                path: [1, RADICAND],
                prev: 2,
                next: Infinity,
            });
            // e.g. not.toHaveSelection()
            expect(newState.selectionStart).toBe(undefined);
        });

        describe("parens", () => {
            describe("inserting with '('", () => {
                test("from the start", () => {
                    const math = Util.row("1+2+3");
                    const cursor = {
                        path: [],
                        prev: 2,
                        next: 3,
                    };
                    const selectionStart = {
                        path: [],
                        prev: -Infinity,
                        next: 0,
                    };

                    const state: State = {math, cursor, selectionStart};
                    const action = {type: "("};

                    const newState = reducer(state, action);

                    expect(newState.math).toEqualMath(Util.row("(1+2)+3"));
                    expect(newState.cursor).toEqual({
                        path: [],
                        prev: 0,
                        next: 1,
                    });
                });

                test("at the end", () => {
                    const math = Util.row("1+2+3");
                    const cursor = {
                        path: [],
                        prev: 4,
                        next: Infinity,
                    };
                    const selectionStart = {
                        path: [],
                        prev: 1,
                        next: 2,
                    };

                    const state: State = {math, cursor, selectionStart};
                    const action = {type: "("};

                    const newState = reducer(state, action);

                    expect(newState.math).toEqualMath(Util.row("1+(2+3)"));
                    expect(newState.cursor).toEqual({
                        path: [],
                        prev: 2,
                        next: 3,
                    });
                });
            });

            describe("inserting with ')'", () => {
                test("from the start", () => {
                    const math = Util.row("1+2+3");
                    const cursor = {
                        path: [],
                        prev: 2,
                        next: 3,
                    };
                    const selectionStart = {
                        path: [],
                        prev: -Infinity,
                        next: 0,
                    };

                    const state: State = {math, cursor, selectionStart};
                    const action = {type: ")"};

                    const newState = reducer(state, action);

                    expect(newState.math).toEqualMath(Util.row("(1+2)+3"));
                    expect(newState.cursor).toEqual({
                        path: [],
                        prev: 4,
                        next: 5,
                    });
                });

                test("at the end", () => {
                    const math = Util.row("1+2+3");
                    const cursor = {
                        path: [],
                        prev: 4,
                        next: Infinity,
                    };
                    const selectionStart = {
                        path: [],
                        prev: 1,
                        next: 2,
                    };

                    const state: State = {math, cursor, selectionStart};
                    const action = {type: ")"};

                    const newState = reducer(state, action);

                    expect(newState.math).toEqualMath(Util.row("1+(2+3)"));
                    expect(newState.cursor).toEqual({
                        path: [],
                        prev: 6,
                        next: Infinity,
                    });
                });
            });
        });
    });
});
