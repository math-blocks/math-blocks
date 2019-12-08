// @flow
import * as Semantic from "../../semantic.js";
import print from "../../print.js";
import {parse} from "../../text/text-parser.js";

import StepChecker from "../step-checker.js";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next);

describe("IntegerChecker", () => {
    it("a + -a -> 0", () => {
        const before = parse("a + -a");
        const after = parse("0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a + -a");
        expect(print(result.reasons[0].nodes[1])).toEqual("0");
    });

    it("0 -> a + -a", () => {
        const before = parse("0");
        const after = parse("a + -a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("0");
        expect(print(result.reasons[0].nodes[1])).toEqual("a + -a");
    });

    it("a + b + -a + c -> b + c", () => {
        const before = parse("a + b + -a + c");
        const after = parse("b + c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("a - b -> a + -b", () => {
        const before = parse("a - b");
        const after = parse("a + -b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + -b -> a - b", () => {
        const before = parse("a + -b");
        const after = parse("a - b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a + b - c -> a + b + -c", () => {
        const before = parse("a + b - c");
        const after = parse("a + b + -c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - b - c -> a + -b + -c", () => {
        const before = parse("a - b - c");
        const after = parse("a + -b + -c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - b - c -> a - b + -c", () => {
        const before = parse("a - b - c");
        const after = parse("a - b + -c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
        ]);
    });

    it("a - -b -> a + --b -> a + b", () => {
        const before = parse("a - -b");
        const after = parse("a + b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "subtracting is the same as adding the inverse",
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a - -b");
        expect(print(result.reasons[0].nodes[1])).toEqual("a + --b");
        expect(print(result.reasons[1].nodes[0])).toEqual("--b");
        expect(print(result.reasons[1].nodes[1])).toEqual("b");
    });

    it("a + b -> a + --b -> a - -b", () => {
        const before = parse("a + b");
        const after = parse("a - -b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
            "subtracting is the same as adding the inverse",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("b");
        expect(print(result.reasons[0].nodes[1])).toEqual("--b");
        expect(print(result.reasons[1].nodes[0])).toEqual("a + --b");
        expect(print(result.reasons[1].nodes[1])).toEqual("a - -b");
    });

    it("a - a -> 0", () => {
        const before = parse("a - a");
        const after = parse("0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "adding inverse",
        ]);
    });

    it("--a -> a", () => {
        const before = parse("--a");
        const after = parse("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("a -> --a", () => {
        const before = parse("a");
        const after = parse("--a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a");
        expect(print(result.reasons[0].nodes[1])).toEqual("--a");
    });

    it("----a -> --a", () => {
        const before = parse("----a");
        const after = parse("--a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
    });

    it("--a -> ----a", () => {
        const before = parse("--a");
        const after = parse("----a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("--a");
        expect(print(result.reasons[0].nodes[1])).toEqual("----a");
    });

    it("----a -> a", () => {
        const before = parse("----a");
        const after = parse("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("----a");
        expect(print(result.reasons[0].nodes[1])).toEqual("--a");
        expect(print(result.reasons[1].nodes[0])).toEqual("--a");
        expect(print(result.reasons[1].nodes[1])).toEqual("a");
    });

    it("a -> ----a", () => {
        const before = parse("a");
        const after = parse("----a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negative of a negative is positive",
            "negative of a negative is positive",
        ]);
        expect(print(result.reasons[0].nodes[0])).toEqual("a");
        expect(print(result.reasons[0].nodes[1])).toEqual("--a");
        expect(print(result.reasons[1].nodes[0])).toEqual("--a");
        expect(print(result.reasons[1].nodes[1])).toEqual("----a");
    });

    it("-a -> -1 * a", () => {
        const before = parse("-a");
        const after = parse("-1 * a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("-1*a -> -a", () => {
        const before = parse("-1 * a");
        const after = parse("-a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
        ]);
    });

    it("(-a)(-b) -> ab", () => {
        const before = parse("(-a)(-b)");
        const after = parse("ab");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("ab -> (-a)(-b)", () => {
        const before = parse("ab");
        const after = parse("(-a)(-b)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying two negatives is a positive",
        ]);
    });

    it("-(a + b) -> -a + -b", () => {
        const before = parse("-(a + b)");
        const after = parse("-a + -b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "negation is the same as multipling by negative one",
            "distribution",
        ]);
    });

    it("-a + -b -> -(a + b)", () => {
        const before = parse("-a + -b");
        const after = parse("-(a + b)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
            "negation is the same as multipling by negative one",
        ]);
    });
});
