import {checkStep, toHaveMessages} from "../test-util";

expect.extend({toHaveMessages});

describe("polynomial checks", () => {
    it("2x + 3x -> 5x", () => {
        const result = checkStep("2x + 3x", "5x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("(1/2)(x) + (3/2)(x) -> 2x", () => {
        const result = checkStep("(1/2)(x) + (3/2)(x)", "2x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("5x + -2x -> 3x", () => {
        const result = checkStep("5x + -2x", "3x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "move negation inside multiplication",
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("5x - 2x -> 3x", () => {
        const result = checkStep("5x - 2x", "3x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "subtracting is the same as adding the inverse",
            "move negation inside multiplication",
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("(x)(5) + 3x -> 8x", () => {
        const result = checkStep("(x)(5) + 3x", "8x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("(x)(2)(-3) + 5x -> 11x", () => {
        const result = checkStep("(x)(2)(-3) + 5x", "-x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "evaluate multiplication",
            "collect like terms",
            "evaluation of addition",
            "negation is the same as multipling by negative one",
        ]);
    });

    it("(2 + 3)(x) + 3x -> 8x", () => {
        const result = checkStep("(2 + 3)(x) + 3x", "8x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "evaluate coefficient",
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("2x + 3x + 4y + 5y -> 5x + 9y", () => {
        const result = checkStep("2x + 3x + 4y + 5y", "5x + 9y");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
            "evaluation of addition",
        ]);
    });

    it("1 + 2x + 3x -> 5x + 1", () => {
        const result = checkStep("1 + 2x + 3x", "5x + 1");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("2x + 3x + 1 -> 5x + 1", () => {
        const result = checkStep("2x + 3x + 1", "5x + 1");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("7 + 2x + 3x + 1 -> 5x + 8", () => {
        const result = checkStep("7 + 2x + 3x + 1", "5x + 8");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "evaluation of addition",
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("x + 3x -> 4x", () => {
        const result = checkStep("x + 3x", "4x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("x^2 + 3x^2 -> 4x^2", () => {
        const result = checkStep("x^2 + 3x^2", "4x^2");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("xy + 3xy -> 4xy", () => {
        const result = checkStep("xy + 3xy", "4xy");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("x + x -> 2x", () => {
        const result = checkStep("x + x", "2x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    it("x^2 + x + x + 1 -> x^2 + 2x + 1", () => {
        const result = checkStep("x^2 + x + x + 1", "x^2 + 2x + 1");

        expect(result).toBeTruthy();
    });

    it("x*x + x*1 + 1*x + 1*1 -> x^2 + 2x + 1", () => {
        const result = checkStep("x*x + x*1 + 1*x + 1*1", "x^2 + 2x + 1");

        expect(result).toBeTruthy();
    });

    // TODO: get this test case passing
    it.skip("3/x + 4/x -> 7/x", () => {
        const result = checkStep("3/x + 4/x", "7/x");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });

    // TODO: get this test case passing
    it.skip("x/3 + x/4 -> 7x/12", () => {
        const result = checkStep("x/3 + x/4", "7x/12");

        expect(result).toBeTruthy();
        expect(result).toHaveMessages([
            "collect like terms",
            "evaluation of addition",
        ]);
    });
});
