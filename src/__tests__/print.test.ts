import print from "../print";
import {Expression, Ident, Num} from "../semantic/semantic";

const ident = (name: string): Ident => ({
    type: "identifier",
    name,
});

const num = (value: string): Num => ({
    type: "number",
    value,
});

describe("print", () => {
    describe("constants", () => {
        test("pi", () => {
            const ast: Expression = {
                type: "pi",
            };

            const result = print(ast);

            expect(result).toEqual("π");
        });

        test("infinity", () => {
            const ast: Expression = {
                type: "infinity",
            };

            const result = print(ast);

            expect(result).toEqual("∞");
        });
    });

    describe("basic operators", () => {
        test("add", () => {
            const ast: Expression = {
                type: "add",
                args: [ident("a"), ident("b"), ident("c")],
            };

            const result = print(ast);

            expect(result).toEqual("a + b + c");
        });

        test("subtraction", () => {
            const ast: Expression = {
                type: "add",
                args: [
                    ident("a"),
                    {
                        type: "neg",
                        args: [ident("b")],
                        subtraction: true,
                    },
                    ident("c"),
                ],
            };

            const result = print(ast);

            expect(result).toEqual("a - b + c");
        });

        test("negation", () => {
            const ast: Expression = {
                type: "add",
                args: [
                    ident("a"),
                    {
                        type: "neg",
                        args: [ident("b")],
                        subtraction: false,
                    },
                    ident("c"),
                ],
            };

            const result = print(ast);

            expect(result).toEqual("a + -b + c");
        });

        test("nested negation", () => {
            const ast: Expression = {
                type: "neg",
                args: [
                    {
                        type: "neg",
                        args: [ident("a")],
                        subtraction: false,
                    },
                ],
                subtraction: false,
            };

            const result = print(ast);

            expect(result).toEqual("--a");
        });

        test("add inside a mul", () => {
            const ast: Expression = {
                type: "mul",
                args: [
                    {
                        type: "add",
                        args: [ident("x"), num("1")],
                    },
                    {
                        type: "add",
                        args: [ident("x"), num("1")],
                    },
                ],
                implicit: false,
            };

            const result = print(ast);

            expect(result).toEqual("(x + 1) * (x + 1)");
        });

        test("div", () => {
            const ast: Expression = {
                type: "div",
                args: [num("2"), num("3")],
            };

            const result = print(ast);

            expect(result).toEqual("2 / 3");
        });

        test("mod", () => {
            const ast: Expression = {
                type: "mod",
                args: [num("2"), num("3")],
            };

            const result = print(ast);

            expect(result).toEqual("2 mod 3");
        });

        test("square root", () => {
            const ast: Expression = {
                type: "root",
                args: [
                    {
                        type: "add",
                        args: [ident("x"), num("1")],
                    },
                    num("2"),
                ],
            };

            const result = print(ast);

            expect(result).toEqual("√(x + 1)");
        });

        test("exponents w/o parens", () => {
            const ast: Expression = {
                type: "exp",
                args: [
                    ident("x"),
                    {type: "exp", args: [ident("y"), ident("z")]},
                ],
            };

            const result = print(ast);

            expect(result).toEqual("x^y^z");
        });

        test("exponents w/ parens", () => {
            const ast: Expression = {
                type: "exp",
                args: [
                    {type: "exp", args: [ident("x"), ident("y")]},
                    ident("z"),
                ],
            };

            const result = print(ast);

            expect(result).toEqual("(x^y)^z");
        });

        test("logarithm w/ base", () => {
            const ast: Expression = {
                type: "log",
                args: [
                    num("2"), // base
                    ident("z"),
                ],
            };

            const result = print(ast);

            expect(result).toEqual("log_2(z)");
        });

        test("absolute function", () => {
            const ast: Expression = {
                type: "abs",
                args: [
                    {
                        type: "add",
                        args: [ident("x"), num("1")],
                    },
                ],
            };

            const result = print(ast);

            expect(result).toEqual("|x + 1|");
        });

        test("function", () => {
            const ast: Expression = {
                type: "func",
                func: ident("f"),
                args: [ident("x"), ident("y")],
            };

            const result = print(ast);

            expect(result).toEqual("f(x, y)");
        });
    });

    describe("big operators", () => {
        test.skip("sum", () => {
            // TODO
        });

        test.skip("prod", () => {
            // TODO
        });

        test("limit", () => {
            const ast: Expression = {
                type: "lim",
                bvar: ident("x"),
                target: {type: "infinity"},
                value: {type: "div", args: [num("1"), ident("x")]},
            };

            const result = print(ast);

            expect(result).toEqual("lim_(x→∞) 1 / x");
        });

        test("diff", () => {
            const ast: Expression = {
                type: "diff",
                args: [ident("f")],
            };

            const result = print(ast);

            expect(result).toEqual("f'");
        });

        test.skip("int", () => {
            // TODO
        });
    });

    describe("numeric relations", () => {
        test("equals", () => {
            const ast: Expression = {
                type: "eq",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x = y = z");
        });

        test("not equals", () => {
            const ast: Expression = {
                type: "neq",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x ≠ y ≠ z");
        });

        test("less than", () => {
            const ast: Expression = {
                type: "lt",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x < y < z");
        });

        test("less than or equal", () => {
            const ast: Expression = {
                type: "lte",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x ≤ y ≤ z");
        });

        test("greater than", () => {
            const ast: Expression = {
                type: "gt",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x > y > z");
        });

        test("greater than or equal", () => {
            const ast: Expression = {
                type: "gte",
                args: [ident("x"), ident("y"), ident("z")],
            };

            const result = print(ast);

            expect(result).toEqual("x ≥ y ≥ z");
        });
    });

    describe("logic", () => {
        test("binary and", () => {
            const ast: Expression = {
                type: "and",
                args: [ident("A"), ident("B")],
            };

            const result = print(ast);

            expect(result).toEqual("A ∧ B");
        });

        test("n-ary and", () => {
            const ast: Expression = {
                type: "and",
                args: [ident("A"), ident("B"), ident("C")],
            };

            const result = print(ast);

            expect(result).toEqual("A ∧ B ∧ C");
        });

        test("binary or", () => {
            const ast: Expression = {
                type: "or",
                args: [ident("A"), ident("B")],
            };

            const result = print(ast);

            expect(result).toEqual("A ∨ B");
        });

        test("n-ary or", () => {
            const ast: Expression = {
                type: "or",
                args: [ident("A"), ident("B"), ident("C")],
            };

            const result = print(ast);

            expect(result).toEqual("A ∨ B ∨ C");
        });

        test("binary xor", () => {
            const ast: Expression = {
                type: "xor",
                args: [ident("A"), ident("B")],
            };

            const result = print(ast);

            expect(result).toEqual("A ⊕ B");
        });

        test("n-ary xor", () => {
            const ast: Expression = {
                type: "xor",
                args: [ident("A"), ident("B"), ident("C")],
            };

            const result = print(ast);

            expect(result).toEqual("A ⊕ B ⊕ C");
        });

        test("implies", () => {
            const ast: Expression = {
                type: "implies",
                args: [ident("A"), ident("B")],
            };

            const result = print(ast);

            expect(result).toEqual("A ⇒ B");
        });

        test("iff", () => {
            const ast: Expression = {
                type: "iff",
                args: [ident("A"), ident("B")],
            };

            const result = print(ast);

            expect(result).toEqual("A ⇔ B");
        });

        test("not", () => {
            const ast: Expression = {
                type: "not",
                args: [ident("A")],
            };

            const result = print(ast);

            expect(result).toEqual("¬A");
        });

        test("true", () => {
            const ast: Expression = {
                type: "true",
            };

            const result = print(ast);

            expect(result).toEqual("T");
        });

        test("false", () => {
            const ast: Expression = {
                type: "false",
            };

            const result = print(ast);

            expect(result).toEqual("F");
        });
    });

    describe("sets", () => {
        test("set", () => {
            const ast: Expression = {
                type: "set",
                args: [num("1"), num("3.141592"), ident("x")],
            };

            const result = print(ast);

            expect(result).toEqual("{1, 3.141592, x}");
        });

        test("binary union", () => {
            const ast: Expression = {
                type: "union",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⋃ Q");
        });

        test("n-ary union", () => {
            const ast: Expression = {
                type: "union",
                args: [ident("P"), ident("Q"), ident("R")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⋃ Q ⋃ R");
        });

        test("binary intersection", () => {
            const ast: Expression = {
                type: "intersection",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⋂ Q");
        });

        test("n-ary intersection", () => {
            const ast: Expression = {
                type: "intersection",
                args: [ident("P"), ident("Q"), ident("R")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⋂ Q ⋂ R");
        });

        test("set diff", () => {
            const ast: Expression = {
                type: "setdiff",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ∖ Q");
        });

        test("binary cartesion product", () => {
            const ast: Expression = {
                type: "cartesianproduct",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P × Q");
        });

        test("n-ary cartesion product", () => {
            const ast: Expression = {
                type: "cartesianproduct",
                args: [ident("P"), ident("Q"), ident("R")],
            };

            const result = print(ast);

            expect(result).toEqual("P × Q × R");
        });

        test("in", () => {
            const ast: Expression = {
                type: "in",
                args: [ident("x"), ident("P")],
            };

            const result = print(ast);

            expect(result).toEqual("x ∈ P");
        });

        test("notin", () => {
            const ast: Expression = {
                type: "notin",
                args: [ident("x"), ident("P")],
            };

            const result = print(ast);

            expect(result).toEqual("x ∉ P");
        });

        test("subset", () => {
            const ast: Expression = {
                type: "subset",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⊆ Q");
        });

        test("proper subset", () => {
            const ast: Expression = {
                type: "prsubset",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⊂ Q");
        });

        test("not subset", () => {
            const ast: Expression = {
                type: "notsubset",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⊈ Q");
        });

        test("not proper subset", () => {
            const ast: Expression = {
                type: "notprsubset",
                args: [ident("P"), ident("Q")],
            };

            const result = print(ast);

            expect(result).toEqual("P ⊄ Q");
        });

        test("empty", () => {
            const ast: Expression = {
                type: "empty",
            };

            const result = print(ast);

            expect(result).toEqual("∅");
        });

        test("naturals", () => {
            const ast: Expression = {
                type: "naturals",
            };

            const result = print(ast);

            expect(result).toEqual("ℕ");
        });

        test("integers", () => {
            const ast: Expression = {
                type: "integers",
            };

            const result = print(ast);

            expect(result).toEqual("ℤ");
        });

        test("rationals", () => {
            const ast: Expression = {
                type: "rationals",
            };

            const result = print(ast);

            expect(result).toEqual("ℚ");
        });

        test("reals", () => {
            const ast: Expression = {
                type: "reals",
            };

            const result = print(ast);

            expect(result).toEqual("ℝ");
        });

        test("complexes", () => {
            const ast: Expression = {
                type: "complexes",
            };

            const result = print(ast);

            expect(result).toEqual("ℂ");
        });
    });
});
