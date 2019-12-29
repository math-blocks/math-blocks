import reducer from "../editor-reducer";
import * as Editor from "../editor";
import * as Util from "../util";
const {row, glyph, subsup} = Editor;

import {State} from "../editor-reducer";

const SUB = 0;
const SUP = 1;
const NUMERATOR = 0;
const DENOMINATOR = 1;
const RADICAND = 0;

describe("reducer", () => {
    describe("inserting", () => {
        describe("a regular character", () => {
            it("a the start", () => {
                const math = Util.row("+2");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "1"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1+2")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("in the middle", () => {
                const math = Util.row("12");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "+"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1+2")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("at the end", () => {
                const math = Util.row("1+");
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "2"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1+2")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 2,
                    next: null,
                });
            });
        });

        describe("inserting '-' inserts '\u2212'", () => {
            test("in the middle of a row", () => {
                const math = Util.row("ab");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "-"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("a\u2212b")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("at the end of a row", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "-"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("a\u2212")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: null,
                });
            });

            test("at the start of a row", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "-"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("\u2212a")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });

        describe("insert '*' inserts '\u00B7'", () => {
            it("in the middle of the row", () => {
                const math = Util.row("ab");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "*"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("a\u00B7b")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("at the end of a row", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "*"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("a\u00B7")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: null,
                });
            });

            it("at the start of a row", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "*"});
                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("\u00B7a")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });

        describe("subsup", () => {
            it("'^' should insert a new sup at the end", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "^"});

                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: null,
                });
            });

            it("'^' should insert a new sup in the middle end", () => {
                const math = Util.row("ab");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "^"});

                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: null,
                });
            });

            it("'_' should insert a new sub at the end", () => {
                const math = Util.row("a");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "_"});

                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: null,
                });
            });

            it("'_' should insert a new sup in the middle end", () => {
                const math = Util.row("ab");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "_"});

                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: null,
                });
            });

            it("'^' should navigate into an existing sup", () => {
                const math = row([glyph("a"), Util.sup("x")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "^"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                });
            });

            it("'_' should navigate into an existing sub", () => {
                const math = row([glyph("a"), Util.sub("x")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "_"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                });
            });

            it("'^' should change an existing sub into an subsup", () => {
                const math = row([glyph("a"), Util.sub("x")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "^"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("a"), Util.subsup("x", "")])),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: null,
                });
            });

            it("'^' should change an existing sup into an subsup", () => {
                const math = row([glyph("a"), Util.sup("x")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "_"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("a"), Util.subsup("", "x")])),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: null,
                });
            });
        });

        describe("frac", () => {
            it("'/' should insert a fraction", () => {
                const math = Util.row("eg");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "/"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([glyph("e"), Util.frac("", ""), glyph("g")]),
                    ),
                );
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: null,
                    next: null,
                });
            });

            test("inserting fractions at the end of a row", () => {
                const math = Util.row("eg");
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "/"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([glyph("e"), glyph("g"), Util.frac("", "")]),
                    ),
                );
                expect(newState.cursor).toEqual({
                    path: [2, NUMERATOR],
                    prev: null,
                    next: null,
                });
            });
        });

        describe("root", () => {
            it("\u221A should insert a frac node", () => {
                const math = Util.row("12");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "\u221A"});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([glyph("1"), Util.sqrt(""), glyph("2")]),
                    ),
                );
            });
        });

        describe("parens", () => {
            it("'(' should insert a parens node", () => {
                const math = Util.row("12");
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, {type: "("});

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([glyph("1"), Util.parens(""), glyph("2")]),
                    ),
                );
                expect(newState.cursor).toEqual({
                    path: [1],
                    prev: null,
                    next: null,
                });
            });
        });
    });

    describe("deleting", () => {
        const action = {type: "Backspace"};

        describe("row", () => {
            it("from the back should delete the last character and the cursor should remain at the end", () => {
                const math = Util.row("1+");
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: null,
                });
            });

            it("from the front should do nothing", () => {
                const math = Util.row("1+");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1+")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
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
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("e"), subsup(undefined, [])])),
                );

                expect(newState.cursor).toEqual({
                    path: [1, 1],
                    prev: null,
                    next: null,
                });
            });

            it("from the back should delete the last character in the sub", () => {
                const x = glyph("x");
                const math = row([glyph("e"), subsup([x], undefined)]);
                const cursor = {
                    path: [1, 0],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("e"), subsup([], undefined)])),
                );

                expect(newState.cursor).toEqual({
                    path: [1, 0],
                    prev: null,
                    next: null,
                });
            });

            it("should delete the sup after if there are no children", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    subsup([], undefined),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, 0],
                    prev: null,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("eg")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should delete the sub after if there are no children", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    subsup(undefined, []),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, 1],
                    prev: null,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("eg")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should move into the sub from the right", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.sub("x+y"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );

                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: 2,
                    next: null,
                });
            });

            it("should move into the sup from the right", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.sup("x+y"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );

                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: 2,
                    next: null,
                });
            });

            it("should move into the subsup from the right", () => {
                const math = row<Editor.Glyph>([
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

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );

                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: 2,
                    next: null,
                });
            });

            it("should move the sub into the parent when deleting from the front", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.sub("x+y"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("ex+yg")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should move the sup into the parent when deleting from the front", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.sup("x+y"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("ex+yg")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should move the sub into the parent when deleting from the front of the sub", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.subsup("a", "b"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([
                            glyph("e"),
                            glyph("a"),
                            Util.sup("b"),
                            glyph("g"),
                        ]),
                    ),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should move the sup into the parent when deleting from the front of the sup", () => {
                const math = row<Editor.Glyph>([
                    glyph("e"),
                    Util.subsup("a", "b"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(
                        row([
                            glyph("e"),
                            Util.sub("a"),
                            glyph("b"),
                            glyph("g"),
                        ]),
                    ),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });
        });

        describe("frac", () => {
            test("from right enters denominator", () => {
                const math = row([
                    glyph("1"),
                    Util.frac("ab", "cd"),
                    glyph("2"),
                ]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: 1,
                    next: null,
                });
            });

            test("deleting from the start of the denominator", () => {
                const math = row([
                    glyph("1"),
                    Util.frac("ab", "cd"),
                    glyph("2"),
                ]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1abcd2")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 2,
                    next: 3,
                });
            });

            test("deleting from the start of the numerator", () => {
                const math = row([
                    glyph("1"),
                    Util.frac("ab", "cd"),
                    glyph("2"),
                ]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: null,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("1abcd2")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });

        describe("parens", () => {
            test("should move into the parens from the right", () => {
                const math = row([glyph("2"), Util.parens("x+y")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1],
                    prev: 2,
                    next: null,
                });
            });

            test("from the back should delete the last character and the cursor should remain at the end", () => {
                const math = row([glyph("2"), Util.parens("x+y")]);
                const cursor = {
                    path: [1],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(row([glyph("2"), Util.parens("xy")])),
                );
                expect(newState.cursor).toEqual({
                    path: [1],
                    prev: 0,
                    next: 1,
                });
            });

            test("from the front should move children into parent", () => {
                const math = row([glyph("2"), Util.parens("x+y")]);
                const cursor = {
                    path: [1],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("2x+y")),
                );

                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });

        describe("root", () => {
            test("deleting from behind a root moves cursor into the root", () => {
                const math = row([glyph("2"), Util.sqrt("x+y")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, RADICAND],
                    prev: 2,
                    next: null,
                });
            });

            test("deleting from front of root move children into parent", () => {
                const math = row([glyph("2"), Util.sqrt("x+y")]);
                const cursor = {
                    path: [1, RADICAND],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(Util.row("2x+y")),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });
    });

    describe("moving left", () => {
        const action = {type: "ArrowLeft"};

        describe("row", () => {
            it("should move the cursor left within the row", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("should stop moving the cursor at the start of a row", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
                    next: 0,
                });
            });
        });

        describe("subsup", () => {
            it("should enter a sub from the right", () => {
                const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: 2,
                    next: null,
                });
            });

            it("should enter an empty sub from the right", () => {
                const math = row([glyph("e"), Util.sub(""), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: null,
                });
            });

            it("should enter a sup from the right", () => {
                const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: 2,
                    next: null,
                });
            });

            it("should enter an empty sup from the right", () => {
                const math = row([glyph("e"), Util.sup(""), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: null,
                });
            });

            it("should enter a subsup from the right", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("ab", "cd"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: 1,
                    next: null,
                });
            });

            it("should exit a sub to the left", () => {
                const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                const cursor = {
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should exit a sup to the left", () => {
                const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
                const cursor = {
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should exit a subsup to the left from within the sub", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("ab", "cd"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should move from the sup to the sub", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("ab", "cd"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: 1,
                    next: null,
                });
            });
        });

        describe("frac", () => {
            test("entering the denominator from the right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: 1,
                    next: null,
                });
            });

            test("entering an empty denominator from the right", () => {
                const math = row([glyph("a"), Util.frac("xy", ""), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: null,
                });
            });

            test("moving from the denonminator to the numerator", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: 1,
                    next: null,
                });
            });

            test("moving from the denonminator to an empty numerator", () => {
                const math = row([glyph("a"), Util.frac("", "uv"), glyph("b")]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: null,
                    next: null,
                });
            });

            test("exiting from the numerator to the left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });

        describe("root", () => {
            test("entering sqrt", () => {
                const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, RADICAND],
                    prev: 1,
                    next: null,
                });
            });

            test("exiting sqrt with surround glyphs", () => {
                const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
                const cursor = {
                    path: [1, RADICAND],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            test("exiting sqrt without surround glyphs", () => {
                const math = row([Util.sqrt("xy")]);
                const cursor = {
                    path: [0, RADICAND],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
                    next: 0,
                });
            });
        });

        describe("parens", () => {
            test("entering parens", () => {
                const math = row([glyph("a"), Util.parens("xy"), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 1,
                    next: 2,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1],
                    prev: 1,
                    next: null,
                });
            });

            test("exiting parens with surround glyphs", () => {
                const math = row([glyph("a"), Util.parens("xy"), glyph("b")]);
                const cursor = {
                    path: [1],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            test("exiting parens without surround glyphs", () => {
                const math = row([Util.parens("xy")]);
                const cursor = {
                    path: [0],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: null,
                    next: 0,
                });
            });
        });
    });

    describe("moving right", () => {
        const action = {type: "ArrowRight"};

        describe("row", () => {
            it("should move the cursor inside a row", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: null,
                    next: 0,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("should stop moving the cursor at the end of a row", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 2,
                    next: null,
                });
            });
        });

        describe("subsup", () => {
            it("should enter a sub from the left", () => {
                const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                });
            });

            it("should enter an empty sub from the left", () => {
                const math = row([glyph("e"), Util.sub(""), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: null,
                });
            });

            it("should enter a sup from the left", () => {
                const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                });
            });

            it("should enter an empty sup from the left", () => {
                const math = row([glyph("e"), Util.sup(""), glyph("g")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: null,
                });
            });

            it("should enter a subsup from the left", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("a", "b"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUB],
                    prev: null,
                    next: 0,
                });
            });

            it("should exit a sub to the right", () => {
                const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                const cursor = {
                    path: [1, SUB],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("should exit a sup to the right", () => {
                const math = row([glyph("e"), Util.sup("1+2"), glyph("g")]);
                const cursor = {
                    path: [1, SUP],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("should exit a subsup to the right from within the sup", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("a", "b"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUP],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("should move from the sub to the sup", () => {
                const math = row([
                    glyph("e"),
                    Util.subsup("a", "b"),
                    glyph("g"),
                ]);
                const cursor = {
                    path: [1, SUB],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, SUP],
                    prev: null,
                    next: 0,
                });
            });
        });

        describe("frac", () => {
            test("entering the numerator from the left", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: null,
                    next: 0,
                });
            });

            test("entering an empty numerator from the left", () => {
                const math = row([glyph("a"), Util.frac("", "uv"), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, NUMERATOR],
                    prev: null,
                    next: null,
                });
            });

            test("moving from the numerator to the denominator", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: 0,
                });
            });

            test("moving from the numerator to an empty denominator", () => {
                const math = row([glyph("a"), Util.frac("xy", ""), glyph("b")]);
                const cursor = {
                    path: [1, NUMERATOR],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, DENOMINATOR],
                    prev: null,
                    next: null,
                });
            });

            test("exiting from the denominator to the right", () => {
                const math = row([
                    glyph("a"),
                    Util.frac("xy", "uv"),
                    glyph("b"),
                ]);
                const cursor = {
                    path: [1, DENOMINATOR],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });
        });

        describe("root", () => {
            test("entering sqrt", () => {
                const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1, RADICAND],
                    prev: null,
                    next: 0,
                });
            });

            test("exiting sqrt with surround glyphs", () => {
                const math = row([glyph("a"), Util.sqrt("xy"), glyph("b")]);
                const cursor = {
                    path: [1, RADICAND],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("exiting sqrt without surround glyphs", () => {
                const math = row([Util.sqrt("xy")]);
                const cursor = {
                    path: [0, RADICAND],
                    prev: 1,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: null,
                });
            });
        });

        describe("parens", () => {
            test("entering parens", () => {
                const math = row([glyph("a"), Util.parens("xy"), glyph("b")]);
                const cursor = {
                    path: [],
                    prev: 0,
                    next: 1,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [1],
                    prev: null,
                    next: 0,
                });
            });

            test("exiting parens with surround glyphs", () => {
                const math = row([glyph("a"), Util.parens("xy"), glyph("b")]);
                const cursor = {
                    path: [1],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            test("exiting parens without surround glyphs", () => {
                const math = row([Util.parens("xy")]);
                const cursor = {
                    path: [0],
                    prev: 0,
                    next: null,
                };

                const state: State = {math, cursor};
                const newState = reducer(state, action);

                expect(Editor.stripIDs(newState.math)).toEqual(
                    Editor.stripIDs(math),
                );
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: null,
                });
            });
        });
    });
});
