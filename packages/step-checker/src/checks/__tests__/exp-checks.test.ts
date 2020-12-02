import {checkStep, toParseLike, checkMistake} from "../test-util";

expect.extend({toParseLike});

describe("Exponent checks", () => {
    // TODO: automatically generate tests for testing 'symmetric = true'
    describe("expDef", () => {
        it("a*a*a -> a^3", () => {
            const result = checkStep("a*a*a", "a^3");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a^3 -> a*a*a", () => {
            const result = checkStep("a^3", "a*a*a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*a*a -> a * a^2", () => {
            const result = checkStep("a*a*a", "a * a^2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*a*a*a -> a * a^2 * a", () => {
            const result = checkStep("a*a*a*a", "a * a^2 * a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "commutative property",
            ]);
        });

        it("a*a*a*b*b -> (a^3)(b^2)", () => {
            const result = checkStep("a*a*a*b*b", "(a^3)(b^2)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("(a^3)(b^2) -> a*a*a*b*b", () => {
            const result = checkStep("(a^3)(b^2)", "a*a*a*b*b");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*b*a*b*a -> (a^3)(b^2)", () => {
            // TODO: we should probably include some commutative property steps
            // here so that we show that all of the equivalent terms are lined up.
            const result = checkStep("a*b*a*b*a", "(a^3)(b^2)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "multiplying a factor n-times is an exponent",
            ]);
        });

        it("a*b*a*b*a -> (a^1)(b^2)(a)", () => {
            // TODO: we should probably include some commutative property steps
            // here so that we show that all of the equivalent terms are lined up.
            const result = checkStep("a*b*a*b*a", "(a^2)(b^2)(a)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
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
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^n)(a^m) -> a^(m+n)", () => {
            const result = checkStep("(a^n)(a^m)", "a^(m+n)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
                "commutative property",
            ]);
        });

        it("(a^n)(a^m)(b^x)(b^y) -> a^(n+m)b^(x+y)", () => {
            const result = checkStep("(a^n)(a^m)(b^x)(b^y)", "a^(n+m)b^(x+y)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^2)(a^3) -> a^5", () => {
            const result = checkStep("(a^2)(a^3)", "a^5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
                "evaluation of addition",
            ]);
        });

        it("a^5 -> (a^2)(a^3)", () => {
            const result = checkStep("a^5", "(a^2)(a^3)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "decompose sum",
                "multiplying powers adds their exponents",
            ]);
        });

        it("(a^2)(a^3)(a^4) -> (a^5)(a^4)", () => {
            const result = checkStep("(a^2)(a^3)(a^4)", "(a^5)(a^4)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
                "evaluation of addition",
                "commutative property",
            ]);
        });

        it("(a^2)(a^3)(a^4) -> (a^2)(a^7)", () => {
            const result = checkStep("(a^2)(a^3)(a^4)", "(a^2)(a^7)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
                "evaluation of addition",
            ]);
        });
    });

    describe("expDiv", () => {
        it("(a^5)/(a^3) -> a^(5-3)", () => {
            const result = checkStep("(a^5)/(a^3)", "a^(5-3)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "dividing powers subtracts their exponents",
            ]);
        });

        it("(a^m)/(a^n) -> a^(m-n)", () => {
            const result = checkStep("(a^m)/(a^n)", "a^(m-n)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "dividing powers subtracts their exponents",
            ]);
        });

        it("(a^5)/(a^3) -> a^2", () => {
            const result = checkStep("(a^5)/(a^3)", "a^2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "dividing powers subtracts their exponents",
                "evaluation of addition",
            ]);
        });

        it("a^(m-n) -> (a^m)/(a^n)", () => {
            const result = checkStep("a^(m-n)", "(a^m)/(a^n)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
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
            expect(result.steps.map((step) => step.message)).toEqual([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("1 / a^2 -> a^(-2)", () => {
            const result = checkStep("1 / a^2", "a^(-2)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
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
            expect(result.steps.map((step) => step.message)).toEqual([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);
        });

        it("1 / a^(-2) -> a^2", () => {
            const result = checkStep("1 / a^(-2)", "a^2");

            expect(result).toBeTruthy();
        });
    });

    describe("powOfPow", () => {
        it("(a^n)^m -> a^(n*m)", () => {
            const result = checkStep("(a^n)^m", "a^(nm)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^n)^m -> (a^m)^n", () => {
            const result = checkStep("(a^n)^m", "(a^m)^n");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "commutative property",
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^n)^m -> a^(m*n)", () => {
            const result = checkStep("(a^n)^m", "a^(mn)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "commutative property",
            ]);
        });

        it("a^(n*m) -> (a^n)^m", () => {
            const result = checkStep("a^(nm)", "(a^n)^m");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^2)^3 -> a^(2*3)", () => {
            const result = checkStep("(a^2)^3", "a^(2*3)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("(a^2)^3 -> a^6", () => {
            const result = checkStep("(a^2)^3", "a^6");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "evaluation of multiplication",
            ]);
        });

        it("(x^(ab))^(cd) -> x^(abcd)", () => {
            const result = checkStep("(x^(ab))^(cd)", "x^(abcd)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("((a^x)^y)^z -> a^(xyz)", () => {
            const result = checkStep("((a^x)^y)^z", "a^(xyz)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
                "raising a power to another exponent is the same raising the power once an multiplying the exponents",
            ]);
        });

        it("((a^x)^y)^z -> a^(zyx)", () => {
            const result = checkStep("((a^x)^y)^z", "a^(zyx)");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
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
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "decompose sum",
                "multiplying powers adds their exponents",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("a*a*a*a*a");
            expect(result.steps[0].nodes[1]).toParseLike("a^5");

            expect(result.steps[1].nodes[0]).toParseLike("5");
            expect(result.steps[1].nodes[1]).toParseLike("2+3");

            expect(result.steps[2].nodes[0]).toParseLike("a^(2+3)");
            expect(result.steps[2].nodes[1]).toParseLike("(a^2)(a^3)");
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
