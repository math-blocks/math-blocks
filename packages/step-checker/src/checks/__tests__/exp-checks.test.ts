import {checkStep, toParseLike} from "../test-util";

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

    describe("integration tests", () => {
        it("a*a*a*a*a -> (a^2)(a^3)", () => {
            const result = checkStep("a*a*a*a*a", "(a^2)(a^3)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying a factor n-times is an exponent",
                "decompose sum",
                "addition with identity", // TODO: figure out why this step is showing up
                "multiplying powers adds their exponents",
                "multiplying a factor n-times is an exponent",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("a*a*a*a*a");
            expect(result.steps[0].nodes[1]).toParseLike("a^5");

            expect(result.steps[1].nodes[0]).toParseLike("5");
            expect(result.steps[1].nodes[1]).toParseLike("2+3");

            // TODO: get rid of this step.
            // I think we can do that by moving addZero further down
            expect(result.steps[2].nodes[0]).toParseLike("2+3");
            expect(result.steps[2].nodes[1]).toParseLike("0+2+3");
        });
    });

    describe("mistakes", () => {
        // TODO: fix the infinite loop this triggers
        // TODO: if we mark the nodes in newPrev to indicate which check produced
        // them and what the directionality was.  For instance if we go from
        // (a^2)(a^3) -> a*a*a^3 then the a's in a*a should be marked as generated
        // by expDef that way if expDef tries to do something with them in the future
        // we can exit early.
        it.skip("(a^2)(a^3) -> a^6", () => {
            const result = checkStep("(a^2)(a^3)", "a^6");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplying powers adds their exponents",
                "evaluation of addition",
            ]);
        });
    });
});
