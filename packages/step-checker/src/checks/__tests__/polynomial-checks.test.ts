import {checkStep} from "../test-util";

describe.skip("polynomial checks", () => {
    it("2x + 3x -> 5x", () => {
        const result = checkStep("2x + 3x", "5x");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "factoring",
            "evaluation of addition",
            "commutative property",
        ]);
    });

    it("1 + 2x + 3x -> 1 + 5x", () => {
        const result = checkStep("1 + 2x + 3x", "1 + 5x");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "factoring",
            "evaluation of addition",
            "commutative property",
        ]);
    });

    it("x + 3x -> 4x", () => {
        const result = checkStep("x + 3x", "4x");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "factoring",
            "evaluation of addition",
            "commutative property",
        ]);
    });

    it("x^2 + 3x^2 -> 4x^2", () => {
        const result = checkStep("x^2 + 3x^2", "4x^2");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "factoring",
            "evaluation of addition",
            "commutative property",
        ]);
    });

    it("xy + 3xy -> 4xy", () => {
        const result = checkStep("xy + 3xy", "4xy");

        expect(result).toBeTruthy();
        expect(result.steps.map((step) => step.message)).toEqual([
            "factoring",
            "evaluation of addition",
            "commutative property",
        ]);
    });
});
