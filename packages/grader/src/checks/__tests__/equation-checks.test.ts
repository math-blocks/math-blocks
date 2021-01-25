import * as Testing from "@math-blocks/testing";

import {MistakeId} from "../../enums";

import {
    checkStep,
    checkMistake,
    toParseLike,
    toHaveMessages,
    toHaveStepsLike,
} from "../test-util";

expect.addSnapshotSerializer(Testing.serializer);
expect.extend({toParseLike, toHaveMessages, toHaveStepsLike});

describe("Equation checks", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const result = checkStep("x = y", "x + 5 = y + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> x + 5 + 10 = y + 5 + 10", () => {
            const result = checkStep("x = y", "x + 5 + 10 = y + 5 + 10");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> x + 5 + 10 = y + 15", () => {
            const result = checkStep("x = y", "x + 5 + 10 = y + 15");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
                "decompose sum",
            ]);

            expect(result).toHaveStepsLike([
                ["x = y", "x + 15 = y + 15"],
                ["x + 15", "x + 5 + 10"],
            ]);
        });

        it("x + 5 = y + 5 -> x = y", () => {
            const result = checkStep("x + 5 = y + 5", "x = y");

            expect(result).toBeTruthy();

            expect(result).toHaveMessages([
                "removing adding the same value to both sides",
            ]);
            expect(result).toHaveStepsLike([["x + 5 = y + 5", "x = y"]]);
        });

        it("x + 5 = y + 5 + 5 -> x = y + 5", () => {
            const result = checkStep("x + 5 = y + 5 + 5", "x = y + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "removing adding the same value to both sides",
            ]);

            expect(result).toHaveStepsLike([
                ["x + 5 = y + 5 + 5", "x = y + 5"],
            ]);
        });

        it("x + 5 - 5 = y + 5 + 5 - 5 -> x = y + 5", () => {
            const result = checkStep("x + 5 - 5 = y + 5 + 5 - 5", "x = y + 5");

            expect(result).toHaveMessages([
                "subtracting is the same as adding the inverse",
                "adding inverse",
                "addition with identity",
                "subtracting is the same as adding the inverse",
                "adding inverse",
                "addition with identity",
                // "evaluation of addition",
            ]);

            expect(result).toBeTruthy();
            expect(result.steps[0].before).toParseLike("x + 5 - 5");
            expect(result.steps[0].after).toParseLike("x + 5 + -5");

            expect(result.steps[1].before).toParseLike("x + 5 + -5");
            expect(result.steps[1].after).toParseLike("x + 0");

            expect(result.steps[2].before).toParseLike("x + 0");
            expect(result.steps[2].after).toParseLike("x");

            expect(result.steps[3].before).toParseLike("y + 5 + 5 - 5");
            expect(result.steps[3].after).toParseLike("y + 5 + 5 + -5");

            // TODO: figure out how to get addInverse to match the last two
            // terms instead of the 2nd and the 4th.
            expect(result.steps[4].before).toParseLike("y + 5 + 5 + -5");
            expect(result.steps[4].after).toParseLike("y + 0 + 5");

            expect(result.steps[5].before).toParseLike("y + 0 + 5");
            expect(result.steps[5].after).toParseLike("y + 5");
        });

        it("x = y -> 5 + x = y + 5", () => {
            const result = checkStep("x = y", "5 + x = y + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
                "commutative property",
            ]);

            expect(result).toHaveStepsLike([
                ["x = y", "x + 5 = y + 5"],
                ["x + 5", "5 + x"],
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 + 5 = y + 15 + 5",
            );

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
            ]);
        });

        it("x + a = y + b -> x + a + 5 = y + b + 5", () => {
            const result = checkStep("x + a = y + b", "a + x + 5 = b + y + 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
                "commutative property",
                "commutative property",
            ]);
        });

        it("x = y -> x = y + 0", () => {
            const result = checkStep("x = y", "x = y + 0");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["addition with identity"]);

            expect(result).toHaveStepsLike([["y", "y + 0"]]);
        });

        it("x = y -> x + 3 = y + 7", () => {
            const mistakes = checkMistake("x = y", "x + 3 = y + 7");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("3");
            expect(mistakes[0].nextNodes[1]).toParseLike("7");
        });

        it("x + 3 = y + 7 -> x = y", () => {
            const mistakes = checkMistake("x + 3 = y + 7", "x = y");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("3");
            expect(mistakes[0].prevNodes[1]).toParseLike("7");
            expect(mistakes[0].nextNodes).toHaveLength(0);
        });

        it("x = y -> x = y + 7", () => {
            const mistakes = checkMistake("x = y", "x = y + 7");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("7");
        });

        it("x + y = x + y -> x + y = x + y + 7", () => {
            const mistakes = checkMistake("x + y = x + y", "x + y = x + y + 7");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("7");
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 [incorrect]", () => {
            const mistakes = checkMistake("2x + 5 = 10", "2x + 5 - 5 = 10");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toMatchInlineSnapshot(
                `(neg.sub 5)`,
            );
        });

        // TODO: make this work
        // The issue here is that we're swapping x and y before adding terms
        // on each side.
        it.skip("y = x -> x + 10 = y + 10", () => {
            const result = checkStep("y = x", "x + 10 = y + 10");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "adding the same value to both sides",
                "decompose product",
            ]);
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const result = checkStep("x = y", "x - 5 = y - 5");

            expect(result).toBeTruthy();
            // TODO: customize this message for subtraction
            expect(result).toHaveMessages([
                "adding the same value to both sides",
            ]);
        });

        it("x - 5 = y - 5 -> x = y", () => {
            const result = checkStep("x - 5 = y - 5", "x = y");

            expect(result).toBeTruthy();
            // TODO: customize this to add the same value to both sides
            expect(result).toHaveMessages([
                "removing adding the same value to both sides",
            ]);

            expect(result).toHaveStepsLike([["x - 5 = y - 5", "x = y"]]);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 - 5 = y + 15 - 5",
            );

            expect(result).toBeTruthy();
            // TODO: customize this to add the same value to both sides
            expect(result).toHaveMessages([
                "adding the same value to both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 - 10 [incorrect step]", () => {
            const mistakes = checkMistake(
                "2x + 5 = 10",
                "2x + 5 - 5 = 10 - 10",
            );

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_ADD_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toMatchInlineSnapshot(
                `(neg.sub 5)`,
            );
            expect(mistakes[0].nextNodes[1]).toMatchInlineSnapshot(
                `(neg.sub 10)`,
            );
        });

        it("2x + 5 - 5 = 10 - 5 -> 2x + 5 - 5 = 5", () => {
            const result = checkStep("2x + 5 - 5 = 10 - 5", "2x + 5 - 5 = 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["evaluation of addition"]);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("x = y -> 5x = 5y", () => {
            const result = checkStep("x = y", "5x = 5y");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
            ]);
        });

        // TODO: allow for numeric factors to appear in any position when
        // decomposing products.
        // TODO: the same for decomposing sums.
        it.skip("x = y -> x * 5 * 2 = y * 10", () => {
            const result = checkStep("x = y", "x * 5 * 2 = y * 10");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
                "decompose product",
            ]);

            expect(result).toHaveStepsLike([
                ["x = y", "x * 10 = y * 10"],
                ["x * 10", "x * 5 * 2"],
            ]);
        });

        // It's okay to multiply by different expressions as long as the expressions
        // are equivalent to each other.
        it("x = y -> 5 * 2 * x = 10 * y", () => {
            const result = checkStep("x = y", "5 * 2 * x = 10 * y");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
                "decompose product",
            ]);

            expect(result).toHaveStepsLike([
                ["x = y", "10 * x = 10 * y"],
                ["10 * x", "5 * 2 * x"],
            ]);
        });

        it("5 * 2 * x = 10 * y -> x * 5 * 2 = y * 10", () => {
            const result = checkStep(
                "5 * 2 * x = 10 * y",
                "x * 5 * 2 = y * 10",
            );

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "commutative property",
                "commutative property",
            ]);
        });

        // TODO: make this work
        // The issue here is that we're swapping x and y before multiplying
        // factors on each side.
        it.skip("y = x -> x * 10 = y * 10", () => {
            const result = checkStep("y = x", "x * 10 = y * 10");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
                "decompose product",
            ]);
        });

        it("x * 10 = y * 15 -> 5 * x * 10 = 5 * y * 15", () => {
            const result = checkStep(
                "x * 10 = y * 15",
                "5 * x * 10 = 5 * y * 15",
            );

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
            ]);
        });

        it("xa = yb -> 5ax = 5by", () => {
            const result = checkStep("xa = yb", "5ax = 5by");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiply both sides by the same value",
                "commutative property",
                "commutative property",
            ]);
        });

        it("x = y -> x = 7y", () => {
            const mistakes = checkMistake("x = y", "x = 7y");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_MUL_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("7");
        });

        it("xa = yb -> xa = 7yb", () => {
            const mistakes = checkMistake("xa = yb", "xa = 7yb");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_MUL_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("7");
        });

        it("x = y -> 3x = 7y", () => {
            const mistakes = checkMistake("x = y", "3x = 7y");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_MUL_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("3");
            expect(mistakes[0].nextNodes[1]).toParseLike("7");
        });

        it("3x = 7y -> x = y", () => {
            const mistakes = checkMistake("3x = 7y", "x = y");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_MUL_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(2);
            expect(mistakes[0].prevNodes[0]).toParseLike("3");
            expect(mistakes[0].prevNodes[1]).toParseLike("7");
            expect(mistakes[0].nextNodes).toHaveLength(0);
        });

        it("xa = yb -> 3xa = 7yb", () => {
            const mistakes = checkMistake("xa = yb", "3xa = 7yb");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EQN_MUL_DIFF);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(2);
            expect(mistakes[0].nextNodes[0]).toParseLike("3");
            expect(mistakes[0].nextNodes[1]).toParseLike("7");
        });

        // TODO: return an incorrect result for this test case
        // PLAN: we can write a custom check that see if we're multiplying one
        // side by a certain value and then if the other side is an 'add' node
        // check if we multiplied one of the terms by that same value.
        it("x = y + 1 -> 2x + 2y + 1 [incorrect]", () => {
            expect(() => checkStep("x = y + 1", "2x = 2y + 1")).toThrow();
        });

        it("x = y + 1 -> x = 2y + 1 [incorrect]", () => {
            expect(() => checkStep("x = y + 1", "x = 2y + 1")).toThrow();
        });

        test("2(x + 2.5) = (5)2 -> x + 2.5 = 5", () => {
            const result = checkStep("2(x + 2.5) = (5)2", "x + 2.5 = 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "commutative property",
                "remove multiplication from both sides",
            ]);

            expect(result).toHaveStepsLike([
                ["(5)(2)", "2 * 5"],
                // TODO: how can we make there be preference for having the '2' at
                // the start of the product?
                ["2 * (x + 2.5) = 2 * 5", "x + 2.5 = 5"],
            ]);
        });
    });

    describe("dividing both sides", () => {
        it("x = y -> x / 5 = y / 5", () => {
            const result = checkStep("x = y", "x / 5 = y / 5");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "divide both sides by the same value",
            ]);
        });

        it("x / 5 = y / 5 -> x = y", () => {
            const result = checkStep("x / 5 = y / 5", "x = y");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "remove division by the same amount",
            ]);
            expect(result).toHaveStepsLike([["x / 5 = y / 5", "x = y"]]);
        });

        it("x = y -> x / (5 + 10) = y / 15", () => {
            const result = checkStep("x = y", "x / (5 + 10) = y / 15");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "divide both sides by the same value",
                "decompose sum",
            ]);

            expect(result).toHaveStepsLike([
                ["x = y", "x / 15 = y / 15"],
                ["15", "5 + 10"],
            ]);
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            expect(() => checkStep("x = y", "x / 5 = y / 10")).toThrow();
        });
    });

    describe("mistakes", () => {
        it("2x + 5 = 10 -> 2(x+1) + 2(5) = 10", () => {
            const mistakes = checkMistake("2x + 5 = 10", "2(x+1) + 2(5) = 10");

            expect(mistakes).toHaveLength(2);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("1");

            expect(mistakes[1].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
            expect(mistakes[1].nextNodes).toHaveLength(1);
            expect(mistakes[1].nextNodes[0]).toParseLike("2");
        });

        it("2x + 5 - 5 = 10 - 5 -> 2x = 3", () => {
            expect(() =>
                checkStep("2x + 5 - 5 = 10 - 5", "2x = 3"),
            ).toThrowErrorMatchingInlineSnapshot(`"No path found"`);
        });

        // TODO: while we indeed have detected a mistake here, a better
        // explanation for this mistake is that the user didn't multiply both
        // sides by '2' correctly.  The LHS is correct, but in the RHS only the
        // first term has been multiplied by '2'.
        it("y = x + 1 -> 2y = 2x + 1", () => {
            const mistakes = checkMistake("y = x + 1", "2y = 2x + 1");

            expect(mistakes).toHaveLength(2);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("2");

            expect(mistakes[1].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
            expect(mistakes[1].prevNodes).toHaveLength(0);
            expect(mistakes[1].nextNodes).toHaveLength(1);
            expect(mistakes[1].nextNodes[0]).toParseLike("2");
        });

        // This verifies that these mistakes are detected when the symmetric
        // property of equality is in play.
        it("y = x + 1 -> 2x + 1 = 2y", () => {
            const mistakes = checkMistake("y = x + 1", "2x + 1 = 2y");

            expect(mistakes).toHaveLength(2);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("2");

            expect(mistakes[1].id).toEqual(MistakeId.EXPR_MUL_NON_IDENTITY);
            expect(mistakes[1].prevNodes).toHaveLength(0);
            expect(mistakes[1].nextNodes).toHaveLength(1);
            expect(mistakes[1].nextNodes[0]).toParseLike("2");
        });

        it("2x -> 2(x + 1)", () => {
            const mistakes = checkMistake("2x", "2(x + 1)");

            expect(mistakes).toHaveLength(1);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("1");
        });

        it("2x + 3y -> 2(x + 1) + 3(y + 1)", () => {
            const mistakes = checkMistake("2x + 3y", "2(x + 1) + 3(y + 1)");

            expect(mistakes).toHaveLength(2);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("1");

            expect(mistakes[1].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[1].prevNodes).toHaveLength(0);
            expect(mistakes[1].nextNodes).toHaveLength(1);
            expect(mistakes[1].nextNodes[0]).toParseLike("1");
        });

        // This test checks that error reporting works with the commutative
        // property of addition.
        it("2x + 3y -> 3(y + 1) + 2(x + 1)", () => {
            const mistakes = checkMistake("2x + 3y", "3(y + 1) + 2(x + 1)");

            expect(mistakes).toHaveLength(2);

            expect(mistakes[0].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[0].prevNodes).toHaveLength(0);
            expect(mistakes[0].nextNodes).toHaveLength(1);
            expect(mistakes[0].nextNodes[0]).toParseLike("1");

            expect(mistakes[1].id).toEqual(MistakeId.EXPR_ADD_NON_IDENTITY);
            expect(mistakes[1].prevNodes).toHaveLength(0);
            expect(mistakes[1].nextNodes).toHaveLength(1);
            expect(mistakes[1].nextNodes[0]).toParseLike("1");
        });

        // While the previous test case detected two mistakes, this test cases
        // detects none (even thought it can't find a path).  The reason for this
        // is that the mistakes in the previous case were in separate subtrees.
        // In this test case the x -> x + 1 and y -> y + 1 occur in descendants
        // of a node that contains an mistake (adding + 4 in this case).
        //
        // Detecting these kinds of mistakes would be very expensive.  Trying to
        // explain to a student all the things they did wrong here isn't particularly
        // useful. What would be more useful is realizing the student doesn't
        // know what they're doing a providing a targetted suggestion as to what
        // the next step should be.
        it("2x + 3y -> 2(x + 1) + 3(y + 1) + 4", () => {
            // checkStep("2x + 3y", "2(x + 1) + 3(y + 1) + 4")
            // Somehow the mistakes array from context is being lost.  If we
            // switch to it being an optional param instead of passing a new
            // empty array then it may be easier to keep track of.
            expect(() =>
                checkMistake("2x + 3y", "2(x + 1) + 3(y + 1) + 4"),
            ).toThrowErrorMatchingInlineSnapshot(`"No mistakes found"`);

            expect(() =>
                checkStep("2x + 3y", "2(x + 1) + 3(y + 1) + 4"),
            ).toThrowErrorMatchingInlineSnapshot(`"No path found"`);
        });
    });
});
