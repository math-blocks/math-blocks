import {
    checkStep,
    checkMistake,
    toHaveMessages,
    toHaveStepsLike,
} from "../test-util";

expect.extend({toHaveMessages, toHaveStepsLike});

describe("Exponent checks", () => {
    // TODO: automatically generate tests for testing 'symmetric = true'
    describe("expDef", () => {
        it("a*a*a -> a^3", () => {
            const result = checkStep("a*a*a", "a^3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("(x)(x) -> x^2", () => {
            const result = checkStep("(x)(x)", "x^2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a^3 -> a*a*a", () => {
            const result = checkStep("a^3", "a*a*a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*a*a -> a * a^2", () => {
            const result = checkStep("a*a*a", "a * a^2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*a*a*a -> a * a^2 * a", () => {
            const result = checkStep("a*a*a*a", "a * a^2 * a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "commutative property",
            ]);
        });

        it("a*a*a*b*b -> (a^3)(b^2)", () => {
            const result = checkStep("a*a*a*b*b", "(a^3)(b^2)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("(a^3)(b^2) -> a*a*a*b*b", () => {
            const result = checkStep("(a^3)(b^2)", "a*a*a*b*b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*b*a*b*a -> (a^3)(b^2)", () => {
            // TODO: we should probably include some commutative property steps
            // here so that we show that all of the equivalent terms are lined up.
            const result = checkStep("a*b*a*b*a", "(a^3)(b^2)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*b*a*b*a -> (a^1)(b^2)(a)", () => {
            // TODO: we should probably include some commutative property steps
            // here so that we show that all of the equivalent terms are lined up.
            const result = checkStep("a*b*a*b*a", "(a^2)(b^2)(a)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
                "commutative property",
            ]);
        });
    });

    describe("expMul", () => {
        it("(a^n)(a^m) -> a^(n+m)", () => {
            const result = checkStep("(a^n)(a^m)", "a^(n+m)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^n)(a^m) -> a^(m+n)", () => {
            const result = checkStep("(a^n)(a^m)", "a^(m+n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
                "commutative property",
            ]);
        });

        it("(a^n)(a^m)(b^x)(b^y) -> a^(n+m)b^(x+y)", () => {
            const result = checkStep("(a^n)(a^m)(b^x)(b^y)", "a^(n+m)b^(x+y)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^2)(a^3) -> a^5", () => {
            const result = checkStep("(a^2)(a^3)", "a^5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
                "evaluation of addition",
            ]);
        });

        it("a^5 -> (a^2)(a^3)", () => {
            const result = checkStep("a^5", "(a^2)(a^3)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "decompose sum",
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^2)(a^3)(a^4) -> (a^5)(a^4)", () => {
            const result = checkStep("(a^2)(a^3)(a^4)", "(a^5)(a^4)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
                "evaluation of addition",
                "commutative property",
            ]);
        });

        it("(a^2)(a^3)(a^4) -> (a^2)(a^7)", () => {
            const result = checkStep("(a^2)(a^3)(a^4)", "(a^2)(a^7)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying powers adds their exponents",
                "evaluation of addition",
            ]);
        });
    });

    describe("expDiv", () => {
        it("(a^5)/(a^3) -> a^(5-3)", () => {
            const result = checkStep("(a^5)/(a^3)", "a^(5-3)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing powers subtracts their exponents",
            ]);
        });

        it("(a^m)/(a^n) -> a^(m-n)", () => {
            const result = checkStep("(a^m)/(a^n)", "a^(m-n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing powers subtracts their exponents",
            ]);
        });

        it("(a^5)/(a^3) -> a^2", () => {
            const result = checkStep("(a^5)/(a^3)", "a^2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing powers subtracts their exponents",
                "evaluation of addition",
            ]);
        });

        it("a^(m-n) -> (a^m)/(a^n)", () => {
            const result = checkStep("a^(m-n)", "(a^m)/(a^n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing powers subtracts their exponents",
            ]);
        });

        it("(a^5)/(b^3) -> a^2 [no path]", () => {
            expect(() =>
                checkStep("(a^5)/(b^3)", "a^2"),
            ).toThrowErrorMatchingInlineSnapshot(`"No path found"`);
        });
    });

    describe("powNegExp", () => {
        it("a^(-2) -> 1 / a^2", () => {
            const result = checkStep("a^(-2)", "1 / a^2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("1 / a^2 -> a^(-2)", () => {
            const result = checkStep("1 / a^2", "a^(-2)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("1 / (1 / a) -> a", () => {
            const result = checkStep("1 / (1 / a)", "a");

            expect(result).toBeTruthy();
        });

        it("1 / (1 / a^2) -> a^2", () => {
            const result = checkStep("1 / (1 / a^2)", "a^2");

            expect(result).toBeTruthy();
        });

        it("1 / a^(-2) -> 1 / (1 / a^2)", () => {
            const result = checkStep("1 / a^(-2)", "1 / (1 / a^2)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("1 / a^(-2) -> a^2", () => {
            const result = checkStep("1 / a^(-2)", "a^2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);

            expect(result).toHaveStepsLike([
                ["a^(-2)", "1 / a^2"],
                ["1 / (1 / a^2)", "1 * a^2 / 1"],
                ["1 * a^2 / 1", "a^2 / 1"],
                ["a^2 / 1", "a^2"],
            ]);
        });

        it("a^2 -> 1 / a^(-2)", () => {
            const result = checkStep("a^2", "1 / a^(-2)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "division by one",
                "multiplication with identity",
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);

            expect(result).toHaveStepsLike([
                ["a^2", "a^2 / 1"],
                ["a^2 / 1", "1 * a^2 / 1"],
                ["1 * a^2 / 1", "1 / (1 / a^2)"],
                ["1 / a^2", "a^(-2)"],
            ]);
        });
    });

    describe("powOfPow", () => {
        it("(a^n)^m -> a^(n*m)", () => {
            const result = checkStep("(a^n)^m", "a^(nm)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^n)^m -> (a^m)^n", () => {
            const result = checkStep("(a^n)^m", "(a^m)^n");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "commutative property",
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^n)^m -> a^(m*n)", () => {
            const result = checkStep("(a^n)^m", "a^(mn)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "commutative property",
            ]);
        });

        it("a^(n*m) -> (a^n)^m", () => {
            const result = checkStep("a^(nm)", "(a^n)^m");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^2)^3 -> a^(2*3)", () => {
            const result = checkStep("(a^2)^3", "a^(2*3)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^2)^3 -> a^6", () => {
            const result = checkStep("(a^2)^3", "a^6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "evaluation of multiplication",
            ]);
        });

        it("(x^(ab))^(cd) -> x^(abcd)", () => {
            const result = checkStep("(x^(ab))^(cd)", "x^(abcd)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("((a^x)^y)^z -> a^(xyz)", () => {
            const result = checkStep("((a^x)^y)^z", "a^(xyz)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("((a^x)^y)^z -> a^(zyx)", () => {
            const result = checkStep("((a^x)^y)^z", "a^(zyx)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "commutative property",
            ]);
        });
    });

    describe("powOfMul", () => {
        const POW_OF_MUL =
            "A product raised to a exponent is the same as raising each factor to that exponent";

        it("(xy)^n -> (x^n)(y^n)", () => {
            const result = checkStep("(xy)^n", "(x^n)(y^n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([POW_OF_MUL]);
        });

        it("(xyz)^n -> (x^n)(y^n)(z^n)", () => {
            const result = checkStep("(xyz)^n", "(x^n)(y^n)(z^n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([POW_OF_MUL]);
        });
    });

    describe("powOfDiv", () => {
        const POW_OF_DIV =
            "A fraction raised to a exponent is the same a fraction with the numerator and denominator each raised to that exponent";
        const POW_OF_MUL =
            "A product raised to a exponent is the same as raising each factor to that exponent";

        it("(x/y)^n -> x^n / y^n", () => {
            const result = checkStep("(x/y)^n", "x^n / y^n");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([POW_OF_DIV]);
        });

        it("(x/y)^n -> (x^n)(y^(-n))", () => {
            const result = checkStep("(x/y)^n", "(x^n)(y^(-n))");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                POW_OF_DIV,
                "division is multiplication by a fraction",
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("(x^n)(y^(-n)) -> (x/y)^n", () => {
            const result = checkStep("(x^n)(y^(-n))", "(x/y)^n");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
                "division is multiplication by a fraction",
                POW_OF_DIV,
            ]);
        });

        it("(1/y)^n -> 1 / y^n", () => {
            const result = checkStep("(1/y)^n", "1 / y^n");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                POW_OF_DIV,
                "1 raised to any power is equal to 1",
            ]);
        });

        it("(ab / cd)^n -> (a^n)(b^n) / (c^n)(d^n)", () => {
            const result = checkStep("(ab / cd)^n", "(a^n)(b^n) / (c^n)(d^n)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([POW_OF_DIV, POW_OF_MUL, POW_OF_MUL]);
        });
    });

    describe("powToZero", () => {
        it("x^0 -> 1", () => {
            const result = checkStep("x^0", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "anything raised to 0 is equal to 1",
            ]);
            expect(result).toHaveStepsLike([["x^0", "1"]]);
        });

        it("x^(a + -a) -> 1", () => {
            const result = checkStep("x^(a + -a)", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding inverse",
                "anything raised to 0 is equal to 1",
            ]);
            expect(result).toHaveStepsLike([
                ["a + -a", "0"],
                ["x^0", "1"],
            ]);
        });

        // This isn't a very common thing for people to do.  Maybe this check
        // shouldn't be symmetric.
        it("1 -> x^0", () => {
            const result = checkStep("1", "x^0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "anything raised to 0 is equal to 1",
            ]);
            expect(result).toHaveStepsLike([["1", "x^0"]]);
        });

        it("(x^n)^0 -> 1", () => {
            const result = checkStep("(x^n)^0", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "anything raised to 0 is equal to 1",
            ]);
            expect(result).toHaveStepsLike([["(x^n)^0", "1"]]);
        });

        it("(x^0)^n -> 1", () => {
            const result = checkStep("(x^0)^n", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "anything raised to 0 is equal to 1",
                "1 raised to any power is equal to 1",
            ]);
            expect(result).toHaveStepsLike([
                ["x^0", "1"],
                ["1^n", "1"],
            ]);
        });
    });

    describe("powerOfZero", () => {
        it("0^n -> 0", () => {
            const result = checkStep("0^n", "0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "0 raised to any power (except for 0) is 0",
            ]);
            expect(result).toHaveStepsLike([["0^n", "0"]]);
        });

        it("(a * 0)^n -> 0", () => {
            const result = checkStep("(a * 0)^n", "0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication by zero",
                "0 raised to any power (except for 0) is 0",
            ]);
            expect(result).toHaveStepsLike([
                ["a * 0", "0"],
                ["0^n", "0"],
            ]);
        });

        // This isn't a very common thing for people to do.  Maybe this check
        // shouldn't be symmetric.
        it("0 -> 0^n", () => {
            const result = checkStep("0", "0^n");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "0 raised to any power (except for 0) is 0",
            ]);
            expect(result).toHaveStepsLike([["0", "0^n"]]);
        });
    });

    describe("integration tests", () => {
        it("a*a*a*a*a -> (a^2)(a^3)", () => {
            const result = checkStep("a*a*a*a*a", "(a^2)(a^3)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying a factor n-times is an exponent",
                "decompose sum",
                "multiplying powers adds their exponents",
            ]);

            expect(result).toHaveStepsLike([
                ["a*a*a*a*a", "a^5"],
                ["5", "2 + 3"],
                ["a^(2+3)", "a^2a^3"],
            ]);
        });

        it("(x + 1)^2 -> (x + 1)(x + 1)", () => {
            const result = checkStep("(x + 1)^2", "(x + 1)(x + 1)");

            expect(result).toBeTruthy();
        });

        it("(x + 1)(x + 1) -> x*x + x*1 + x*1 + 1*1", () => {
            const result = checkStep("(x + 1)(x + 1)", "x*x + x*1 + x*1 + 1*1");

            expect(result).toBeTruthy();
        });

        it("x*x + x*1 + x*1 + 1*1 -> x^2 + x + x + 1", () => {
            const result = checkStep(
                "x*x + x*1 + x*1 + 1*1",
                "x^2 + x + x + 1",
            );

            expect(result).toBeTruthy();
        });

        // TODO: make this test pass (dedupe with polynomial-checks.test.ts)
        it.skip("x^2 + x + x + 1 -> x^2 + 2x + 1", () => {
            const result = checkStep("x^2 + x + x + 1", "x^2 + 2x + 1");

            expect(result).toBeTruthy();
        });

        // TODO: make this test pass
        it.skip("(x + 1)^2 -> x^2 + 2x + 1", () => {
            const result = checkStep("(x + 1)^2", "x^2 + 2x + 1");

            expect(result).toBeTruthy();
        });
    });

    describe("mistakes", () => {
        it("(a^2)(a^3) -> a^6", () => {
            const mistake = checkMistake("(a^2)(a^3)", "a^6");

            expect(mistake).toBeTruthy();

            // TODO: add assertions for the nodes in the mistake
        });
    });
});
