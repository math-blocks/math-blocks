import reducer, {State} from "../../above-reducer";
import * as Editor from "../../editor-ast";
import * as Util from "../../util";

expect.extend({
    toEqualMath(received, actual) {
        expect(Editor.stripIDs(received)).toEqual(Editor.stripIDs(actual));
        return {
            pass: true,
            message: () => "hello, world!",
        };
    },
});

describe("parens", () => {
    describe("starting with '('", () => {
        it("should insert a '(' at the start and a pending ')' at the end", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "("});

            const newMath = Util.row("(1+2)");
            if (newMath.children[4].type === "atom") {
                newMath.children[4].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        it("should insert a '(' in the middle and a pending ')' at the end", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: 0,
                next: 1,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "("});

            const newMath = Util.row("1(+2)");
            if (newMath.children[4].type === "atom") {
                newMath.children[4].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        it("should insert a '(' at the end and a pending ')' after it", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: 2,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "("});

            const newMath = Util.row("1+2()");
            if (newMath.children[4].type === "atom") {
                newMath.children[4].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            // TODO: it would be nice if this could be specified by including a '|'
            // in the Editor AST.
            expect(newState.cursor).toEqual({
                path: [],
                prev: 3,
                next: 4,
            });
        });
    });

    describe("completing with ')'", () => {
        it("in the middle", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            let newState;
            newState = reducer(state, {type: "("});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: ")"});

            const newMath = Util.row("(1+)2");
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 3,
                next: 4,
            });
        });

        it("just before the ')'", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            let newState;
            newState = reducer(state, {type: "("});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: ")"});

            const newMath = Util.row("(1+2)");
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 4,
                next: Infinity,
            });
        });

        it("just after the ')'", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            let newState;
            newState = reducer(state, {type: "("});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: "ArrowRight"});
            newState = reducer(newState, {type: ")"});

            const newMath = Util.row("(1+2)");
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 4,
                next: Infinity,
            });
        });
    });

    describe("starting with ')'", () => {
        it("should insert a ')' at the end and a pending '(' at the start", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: 2,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: ")"});

            const newMath = Util.row("(1+2)");
            if (newMath.children[0].type === "atom") {
                newMath.children[0].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 4,
                next: Infinity,
            });
        });

        it("should insert a ')' in the middle and a pending '(' at the start", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: 1,
                next: 2,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: ")"});

            const newMath = Util.row("(1+)2");
            if (newMath.children[0].type === "atom") {
                newMath.children[0].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 3,
                next: 4,
            });
        });

        it("should insert a ')' at the start and a pending '(' before it", () => {
            const math = Util.row("1+2");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: ")"});

            const newMath = Util.row("()1+2");
            if (newMath.children[0].type === "atom") {
                newMath.children[0].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 1,
                next: 2,
            });
        });

        describe("completing with '('", () => {
            it("in the middle", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: Infinity,
                };

                const state: State = {math, cursor};
                let newState;
                newState = reducer(state, {type: ")"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "("});

                const newMath = Util.row("1(+2)");
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 1,
                    next: 2,
                });
            });

            it("just after the '('", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: Infinity,
                };

                const state: State = {math, cursor};
                let newState;
                newState = reducer(state, {type: ")"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "("});

                const newMath = Util.row("(1+2)");
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });

            it("just before the '('", () => {
                const math = Util.row("1+2");
                const cursor = {
                    path: [],
                    prev: 2,
                    next: Infinity,
                };

                const state: State = {math, cursor};
                let newState;
                newState = reducer(state, {type: ")"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "ArrowLeft"});
                newState = reducer(newState, {type: "("});

                const newMath = Util.row("(1+2)");
                expect(newState.math).toEqualMath(newMath);
                expect(newState.cursor).toEqual({
                    path: [],
                    prev: 0,
                    next: 1,
                });
            });
        });
    });

    describe("inserting inside of an existing set of parens", () => {
        it("a(1+2)b -> a(1(+2)b -> a(1(+2))b", () => {
            const math = Util.row("a(1+2)b");
            const cursor = {
                path: [],
                prev: 2,
                next: 3,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "("});

            const newMath = Util.row("a(1(+2))b");
            if (newMath.children[6].type === "atom") {
                newMath.children[6].value.pending = true;
            }
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 3,
                next: 4,
            });
        });

        it("a(1+2)b -> a(1+)2)b -> a((1+)2)b", () => {
            const math = Util.row("a(1+2)b");
            const cursor = {
                path: [],
                prev: 3,
                next: 4,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: ")"});

            const newMath = Util.row("a((1+)2)b");
            if (newMath.children[2].type === "atom") {
                newMath.children[2].value.pending = true;
            }
            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 5,
                next: 6,
            });
        });
    });

    describe("inserting outside an existing set of parens", () => {
        test("before", () => {
            const math = Util.row("a(1+2)b");
            const cursor = {
                path: [],
                prev: -Infinity,
                next: 0,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: "("});
            const newMath = Util.row("(a(1+2)b)");
            if (newMath.children[8].type === "atom") {
                newMath.children[8].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 0,
                next: 1,
            });
        });

        test("after", () => {
            const math = Util.row("a(1+2)b");
            const cursor = {
                path: [],
                prev: 6,
                next: Infinity,
            };

            const state: State = {math, cursor};
            const newState = reducer(state, {type: ")"});
            const newMath = Util.row("(a(1+2)b)");
            if (newMath.children[0].type === "atom") {
                newMath.children[0].value.pending = true;
            }

            expect(newState.math).toEqualMath(newMath);
            expect(newState.cursor).toEqual({
                path: [],
                prev: 8,
                next: Infinity,
            });
        });
    });

    test("inserting a character after a pending paren", () => {
        const math = Util.row("(1+2)");
        const cursor = {
            path: [],
            prev: 4,
            next: Infinity,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "+"});

        const newMath = Util.row("(1+2)+");
        expect(newState.math).toEqualMath(newMath);
    });

    test("inserting a character before a pending paren", () => {
        const math = Util.row("(1+2)");
        const cursor = {
            path: [],
            prev: -Infinity,
            next: 0,
        };

        const state: State = {math, cursor};
        const newState = reducer(state, {type: "+"});

        const newMath = Util.row("+(1+2)");
        expect(newState.math).toEqualMath(newMath);
    });
});
