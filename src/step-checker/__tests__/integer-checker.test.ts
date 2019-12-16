import print from "../../print";
import {parse} from "../../text/text-parser";

import StepChecker from "../step-checker";

import {Result} from "../step-checker";

const checker = new StepChecker();

const checkStep = (prev: string, next: string) => {
    return checker.checkStep(parse(prev), parse(next));
};

expect.extend({
    toMatchSteps(result: Result, steps: string[]) {
        const nodes = steps.filter((step, index) => index % 2 == 0);
        for (let i = 0; i < nodes.length - 1; i++) {
            if (print(result.reasons[i].nodes[0]) !== nodes[i]) {
                return {
                    message: () =>
                        `expected ${print(
                            result.reasons[i].nodes[0],
                        )} to equal ${nodes[i]}`,
                    pass: false,
                };
            }
            if (print(result.reasons[i].nodes[1]) !== nodes[i + 1]) {
                return {
                    message: () =>
                        `expected ${print(
                            result.reasons[i].nodes[1],
                        )} to equal ${nodes[i + 1]}`,
                    pass: false,
                };
            }
        }
        const messages = steps.filter((step, index) => index % 2);
        if (result.reasons.length !== messages.length) {
            return {
                message: () =>
                    `expected ${messages.length} reasons but received ${result.reasons.length}`,
                pass: false,
            };
        }
        for (let i = 0; i < messages.length; i++) {
            if (result.reasons[i].message !== messages[i]) {
                return {
                    message: () =>
                        `expected ${messages[i]} but received ${result.reasons[i].message}`,
                    pass: false,
                };
            }
        }
        return {
            message: () => `expected steps not to match`,
            pass: true,
        };
    },
});

describe("IntegerChecker", () => {
    it("a + -a -> 0", () => {
        const result = checkStep("a + -a", "0");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps(["a + -a", "adding inverse", "0"]);
    });

    it("0 -> a + -a", () => {
        const result = checkStep("0", "a + -a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("0");
        expect(print(result.reasons[0].nodes[1])).toEqual("a + -a");
    });

    it("a + b + -a + c -> b + c", () => {
        const result = checkStep("a + b + -a + c", "b + c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("a - b -> a + -b", () => {
        const result = checkStep("a - b", "a + -b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + -b -> a - b", () => {
        const result = checkStep("a + -b", "a - b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + b - c -> a + b + -c", () => {
        const result = checkStep("a + b - c", "a + b + -c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - b - c -> a + -b + -c", () => {
        const result = checkStep("a - b - c", "a + -b + -c");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps([
            "a - b - c",
            "subtracting is the same as adding the inverse",
            "a + -b - c",
            "subtracting is the same as adding the inverse",
            "a + -b + -c",
        ]);
    });

    it("a - b - c -> a - b + -c", () => {
        const result = checkStep("a - b - c", "a - b + -c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - -b -> a + --b -> a + b", () => {
        const result = checkStep("a - -b", "a + b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a - -b");
        expect(print(result.reasons[0].nodes[1])).toEqual("a + --b");
        // TODO: figure out how to for hreplace the --b in a + --b with b to
        // get the full expression for each step.  Having the individual
        // parts is great too ighlighting purposes.
        // If we give each of the nodes an ID then we should be able to
        // sequentially swap out each node from the AST in the sequence
        // of substeps.
        expect(print(result.reasons[1].nodes[0])).toEqual("--b");
        expect(print(result.reasons[1].nodes[1])).toEqual("b");
    });

    it("a + b -> a + --b -> a - -b", () => {
        const result = checkStep("a + b", "a - -b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
            "subtracting is the same as adding the inverse",
        ]);
        // TODO: update .toMatchSteps() to handle this case
        expect(print(result.reasons[0].nodes[0])).toEqual("b");
        expect(print(result.reasons[0].nodes[1])).toEqual("--b");
        expect(print(result.reasons[1].nodes[0])).toEqual("a + --b");
        expect(print(result.reasons[1].nodes[1])).toEqual("a - -b");
    });

    it("a - a -> 0", () => {
        const result = checkStep("a - a", "0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("--a -> a", () => {
        const result = checkStep("--a", "a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("a -> --a", () => {
        const result = checkStep("a", "--a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a");
        expect(print(result.reasons[0].nodes[1])).toEqual("--a");
    });

    it("----a -> --a", () => {
        const result = checkStep("----a", "--a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("--a -> ----a", () => {
        const result = checkStep("--a", "----a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("--a");
        expect(print(result.reasons[0].nodes[1])).toEqual("----a");
    });

    it("----a -> a", () => {
        const result = checkStep("----a", "a");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps([
            "----a",
            "negative of a negative is positive",
            "--a",
            "negative of a negative is positive",
            "a",
        ]);
    });

    it("a -> ----a", () => {
        const result = checkStep("a", "----a");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps([
            "a",
            "negative of a negative is positive",
            "--a",
            "negative of a negative is positive",
            "----a",
        ]);
    });

    it("-a -> -1 * a", () => {
        const result = checkStep("-a", "-1 * a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("-1*a -> -a", () => {
        const result = checkStep("-1 * a", "-a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("(-a)(-b) -> ab", () => {
        const result = checkStep("(-a)(-b)", "ab");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("ab -> (-a)(-b)", () => {
        const result = checkStep("ab", "(-a)(-b)");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("-(a + b) -> -a + -b", () => {
        const result = checkStep("-(a + b)", "-a + -b");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps([
            "-(a + b)",
            "negation is the same as multipling by negative one",
            "-1 * (a + b)",
            "distribution",
            "-a + -b",
        ]);
    });

    it("-a + -b -> -1 * (a + b) -> -(a + b)", () => {
        const result = checkStep("-a + -b", "-(a + b)");

        expect(result.equivalent).toBe(true);
        // @ts-ignore
        expect(result).toMatchSteps([
            "-a + -b",
            "factoring",
            "-1 * (a + b)",
            "negation is the same as multipling by negative one",
            "-(a + b)",
        ]);
    });
});
