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
    });

    describe("mistakes", () => {
        it("(a^2)(a^3) -> a^6", () => {
            const mistake = checkMistake("(a^2)(a^3)", "a^6");

            expect(mistake).toBeTruthy();

            // TODO: add assertions for the nodes in the mistake
        });
    });
});
