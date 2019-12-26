import reducer from "../editor-reducer";
import * as Editor from "../editor";
import * as Util from "../util";
const {row, glyph, subsup} = Editor;

import {State} from "../editor-reducer";

describe("reducer", () => {
    describe("inserting", () => {
        it("insert a charcater and advance the cursor", () => {
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

    describe("deleting", () => {
        const action = {type: "Backspace"};

        describe("root", () => {
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
                    path: [1, 0 /* sub */],
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
                    path: [1, 1 /* sup */],
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
                    path: [1, 1 /* sup */],
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
                    path: [1, 0 /* sub */],
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
                    path: [1, 1 /* sup */],
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
                    path: [1, 0 /* sub */],
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
                    path: [1, 1 /* sup */],
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
                        path: [1, 0 /* sub */],
                        prev: 2,
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
                        path: [1, 1 /* sub */],
                        prev: 2,
                        next: null,
                    });
                });

                it("should enter a subsup from the right", () => {
                    const math = row([
                        glyph("e"),
                        Util.subsup("a", "b"),
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
                        path: [1, 1 /* sup */],
                        prev: 0,
                        next: null,
                    });
                });

                it("should exit a sub to the left", () => {
                    const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                    const cursor = {
                        path: [1, 0 /* sub */],
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
                        path: [1, 1 /* sup */],
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
                        Util.subsup("a", "b"),
                        glyph("g"),
                    ]);
                    const cursor = {
                        path: [1, 0 /* sub */],
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
                        Util.subsup("a", "b"),
                        glyph("g"),
                    ]);
                    const cursor = {
                        path: [1, 1 /* sup */],
                        prev: null,
                        next: 0,
                    };

                    const state: State = {math, cursor};
                    const newState = reducer(state, action);

                    expect(Editor.stripIDs(newState.math)).toEqual(
                        Editor.stripIDs(math),
                    );
                    expect(newState.cursor).toEqual({
                        path: [1, 0 /* sub */],
                        prev: 0,
                        next: null,
                    });
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
                        path: [1, 0 /* sub */],
                        prev: null,
                        next: 0,
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
                        path: [1, 1 /* sub */],
                        prev: null,
                        next: 0,
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
                        path: [1, 0 /* sub */],
                        prev: null,
                        next: 0,
                    });
                });

                it("should exit a sub to the right", () => {
                    const math = row([glyph("e"), Util.sub("1+2"), glyph("g")]);
                    const cursor = {
                        path: [1, 0 /* sub */],
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
                        path: [1, 1 /* sup */],
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
                        path: [1, 1 /* sup */],
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
                        path: [1, 0 /* sub */],
                        prev: 0,
                        next: null,
                    };

                    const state: State = {math, cursor};
                    const newState = reducer(state, action);

                    expect(Editor.stripIDs(newState.math)).toEqual(
                        Editor.stripIDs(math),
                    );
                    expect(newState.cursor).toEqual({
                        path: [1, 1 /* sup */],
                        prev: null,
                        next: 0,
                    });
                });
            });
        });
    });
});
