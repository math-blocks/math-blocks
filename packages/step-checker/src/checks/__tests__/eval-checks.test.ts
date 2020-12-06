import {parse} from "@math-blocks/text-parser";

import StepChecker from "../../step-checker";
import {MistakeId} from "../../enums";

import {
    checkStep,
    checkMistake,
    toParseLike,
    toHaveMessages,
} from "../test-util";

expect.extend({toParseLike, toHaveMessages});

describe("Eval (decomposition) checks", () => {
    describe("evalAdd", () => {
        it("2 + 3 -> 5", () => {
            const result = checkStep("2 + 3", "5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("5 - 2 -> 3", () => {
            const result = checkStep("5 - 2", "3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                // TODO: have an interim step showing 5 - 2 -> 5 + -2
                "evaluation of addition",
            ]);
        });

        it("2 + 3 -> 5 + 0", () => {
            const result = checkStep("2 + 3", "5 + 0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "evaluation of addition",
                "addition with identity",
            ]);
        });

        it("a + 2 + 3 -> a + 5", () => {
            const result = checkStep("a + 2 + 3", "a + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("a + 2 + 3 -> 5 + a", () => {
            const result = checkStep("a + 2 + 3", "5 + a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "evaluation of addition",
                "commutative property",
            ]);
        });

        it("1 + 2 + 3 -> 1 + 5", () => {
            const result = checkStep("1 + 2 + 3", "1 + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        // Currently we're thinking about this in the following way:
        // 1 + 2 + 4 -> 7, 3 -> 3
        // A student though should be adding things that are adjacent
        // If they aren't adjacent, there should be a commutative property step
        it("1 + 2 + 3 + 4 -> 3 + 7", () => {
            const result = checkStep("1 + 2 + 3 + 4", "3 + 7");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        // TODO: make this pass
        it("1 + 2 + 3 + 4 -> 1 + 6 + 3", () => {
            const result = checkStep("1 + 2 + 3 + 4", "1 + 6 + 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        // TODO: the reason should be "evaluation of subtraction"
        it("10 - 5 -> 5", () => {
            const before = "10 - 5";
            const after = "5";

            const result = checkStep(before, after);

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        // TODO: the reason should be "evaluation of subtraction"
        it("1 - 1/3 -> 2/3", () => {
            const before = "1 - 1/3";
            const after = "2/3";

            const result = checkStep(before, after);

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("5 - 5/2 -> 5/2", () => {
            const before = "5 - 5/2";
            const after = "5/2";

            const result = checkStep(before, after);

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("10 - 5 + 2 -> 7", () => {
            const result = checkStep("10 - 5 + 2", "7");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("10 - 5 + 2 -> 5 + 2", () => {
            const result = checkStep("10 - 5 + 2", "5 + 2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });

        it("5 + -5 -> 0", () => {
            const result = checkStep("5 + -5", "0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["adding inverse"]);
        });

        it("1 + 5 + -5 -> 1", () => {
            const result = checkStep("1 + 5 + -5", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding inverse",
                "addition with identity",
            ]);
        });

        it("1 + a + -a -> 1", () => {
            const result = checkStep("1 + a + -a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding inverse",
                "addition with identity",
            ]);
        });
    });

    describe("evalMul", () => {
        it("2 * 3 -> 6", () => {
            const result = checkStep("2 * 3", "6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        it("2 * 3 -> 6 * 1", () => {
            const result = checkStep("2 * 3", "6 * 1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "evaluation of multiplication",
                "multiplication with identity",
            ]);
        });

        it("a * 2 * 3 -> a * 6", () => {
            const result = checkStep("a * 2 * 3", "a * 6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "evaluation of multiplication",
                // TODO: remove unnecessary "commutative property" steps
                "commutative property",
            ]);
        });

        it("2 * 3 * 4 -> 6 * 4", () => {
            const result = checkStep("2 * 3 * 4", "6 * 4");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        it("1/2 * 1/3 -> 1/6", () => {
            const result = checkStep("1/2 * 1/3", "1/6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        it("2 * 1/3 -> 2/3", () => {
            const result = checkStep("2 * 1/3", "2/3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        it("2/3 * 3/4 -> 6/12", () => {
            const result = checkStep("2/3 * 3/4", "6/12");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        // TODO: provide a separate step simplifying the fraction
        it("2/3 * 3/4 -> 1/2", () => {
            const result = checkStep("2/3 * 3/4", "1/2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of multiplication"]);
        });

        it("5 * 1/5 -> 1", () => {
            const result = checkStep("5 * 1/5", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "cancelling in fractions",
            ]);
        });

        it("2 * 5 * 1/5 -> 2", () => {
            const result = checkStep("2 * 5 * 1/5", "2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "cancelling in fractions",
            ]);
        });

        it("2 * 5 * 1/5 -> 2 (don't eval factions)", () => {
            const checker = new StepChecker({evalFractions: false});
            const result = checker.checkStep(parse("2 * 5 * 1/5"), parse("2"), {
                checker,
                steps: [],
                successfulChecks: new Set(),
                reversed: false,
                mistakes: [],
            });

            expect(result).toBeTruthy();
            if (!result) {
                throw new Error("result is undefind");
            }
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "cancelling in fractions",
            ]);
        });

        it("2 * a * 1/a -> 2", () => {
            const result = checkStep("2 * a * 1/a", "2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "cancelling in fractions",
            ]);
        });
    });

    describe("decompProduct", () => {
        it("6 -> 2 * 3", () => {
            const result = checkStep("6", "2 * 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose product"]);
        });

        it("6 * 1 -> 2 * 3", () => {
            const result = checkStep("6 * 1", "2 * 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication with identity",
                "decompose product",
            ]);
        });

        it("6a -> 2 * 3 * a", () => {
            const result = checkStep("6a", "2 * 3 * a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose product"]);
        });

        it("4 * 6 -> 2 * 2 * 2 * 3", () => {
            const result = checkStep("4 * 6", "2 * 2 * 2 * 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose product"]);
        });
    });

    describe("decompSum", () => {
        it("5 -> 2 + 3", () => {
            const result = checkStep("5", "2 + 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose sum"]);
        });

        it("0 + 5 -> 2 + 3", () => {
            const result = checkStep("0 + 5", "2 + 3");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "addition with identity",
                "decompose sum",
            ]);
        });

        it("5 + a -> 2 + 3 + a", () => {
            const result = checkStep("5 + a", "2 + 3 + a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                // TODO: avoid unnecessary commutative property
                "commutative property",
                "decompose sum",
            ]);
        });

        it("5 + 10 -> 2 + 3 + 4 + 6", () => {
            const result = checkStep("5 + 10", "2 + 3 + 4 + 6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose sum"]);
        });

        // This test checks that numbers can be ordered in any fashion
        it("10 + 5 -> 2 + 3 + 4 + 6", () => {
            const result = checkStep("10 + 5", "2 + 3 + 4 + 6");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["decompose sum"]);
        });
    });

    describe("mistakes", () => {
        it("5 + 8 -> 11 (should be 13)", () => {
            // TODO: include prev, next in the result of checkMistake
            const mistakes = checkMistake("5 + 8", "11");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.EVAL_ADD);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("5");
            expect(mistakes[0].prevNodes[1]).toParseLike("8");
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("11");
            expect(mistakes[0].corrections).toHaveLength(1);
            expect(mistakes[0].corrections[0].replacement).toParseLike("13");
        });

        // This test checks that we ignore other numeric terms
        it("1 + 5 + 8 -> 1 + 11 (should be 13)", () => {
            // TODO: include prev, next in the result of checkMistake
            const mistakes = checkMistake("1 + 5 + 8", "1 + 11");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.EVAL_ADD);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("5");
            expect(mistakes[0].prevNodes[1]).toParseLike("8");
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("11");
            expect(mistakes[0].corrections).toHaveLength(1);
            expect(mistakes[0].corrections[0].replacement).toParseLike("13");
        });

        it("11 -> 5 + 8 (decomp adds to 13)", () => {
            const mistakes = checkMistake("11", "5 + 8");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.DECOMP_ADD);
            expect(mistakes[0].prevNodes).toHaveLength(1);
            expect(mistakes[0].prevNodes[0]).toParseLike("11");
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("5");
            expect(mistakes[0].nextNodes[1]).toParseLike("8");
            expect(mistakes[0].corrections).toHaveLength(0);
        });

        it("11 + 1 -> 5 + 8 + 1 (decomp adds to 13)", () => {
            const mistakes = checkMistake("11 + 1", "5 + 8 + 1");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.DECOMP_ADD);
            expect(mistakes[0].prevNodes).toHaveLength(1);
            expect(mistakes[0].prevNodes[0]).toParseLike("11");
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("5");
            expect(mistakes[0].nextNodes[1]).toParseLike("8");
            expect(mistakes[0].corrections).toHaveLength(0);
        });

        it("6 * 8 -> 42 (should be 48)", () => {
            const mistakes = checkMistake("6 * 8", "42");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.EVAL_MUL);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("6");
            expect(mistakes[0].prevNodes[1]).toParseLike("8");
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("42");
            expect(mistakes[0].corrections).toHaveLength(1);
            expect(mistakes[0].corrections[0].replacement).toParseLike("48");
        });

        it("2 * 6 * 8 -> 2 * 42 (should be 2 * 48)", () => {
            const mistakes = checkMistake("2 * 6 * 8", "2 * 42");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.EVAL_MUL);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("6");
            expect(mistakes[0].prevNodes[1]).toParseLike("8");
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("42");
            expect(mistakes[0].corrections).toHaveLength(1);
            expect(mistakes[0].corrections[0].replacement).toParseLike("48");
        });

        it("42 = 6 * 8 (decomp multiplies to 48)", () => {
            const mistakes = checkMistake("42", "6 * 8");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.DECOMP_MUL);
            expect(mistakes[0].prevNodes).toHaveLength(1);
            expect(mistakes[0].prevNodes[0]).toParseLike("42");
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("6");
            expect(mistakes[0].nextNodes[1]).toParseLike("8");
            expect(mistakes[0].corrections).toHaveLength(0);
        });

        it("2 * 42 = 2 * 6 * 8 (decomp multiplies to 2 * 48)", () => {
            const mistakes = checkMistake("2 * 42", "2 * 6 * 8");

            expect(mistakes).toHaveLength(1);
            expect(mistakes[0].id).toEqual(MistakeId.DECOMP_MUL);
            expect(mistakes[0].prevNodes).toHaveLength(1);
            expect(mistakes[0].prevNodes[0]).toParseLike("42");
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("6");
            expect(mistakes[0].nextNodes[1]).toParseLike("8");
            expect(mistakes[0].corrections).toHaveLength(0);
        });
    });
});
