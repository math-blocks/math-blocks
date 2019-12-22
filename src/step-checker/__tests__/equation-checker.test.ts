import * as Semantic from "../../semantic";
import {parse} from "../../text/text-parser";

import StepChecker from "../step-checker";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next, []);

describe("EquationChecker", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const before = parse("x = y");
            const after = parse("x + 5 = y + 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> 5 + x = y + 5", () => {
            const before = parse("x = y");
            const after = parse("5 + x = y + 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const before = parse("x + 10 = y + 15");
            const after = parse("x + 10 + 5 = y + 15 + 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const before = parse("x = y");
            const after = parse("x - 5 = y - 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const before = parse("x + 10 = y + 15");
            const after = parse("x + 10 - 5 = y + 15 - 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 - 10 [incorrect step]", () => {
            const before = parse("2x + 5 = 10");
            const after = parse("2x + 5 - 5 = 10 - 10");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(false);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("x = y -> x * 5 = y * 5", () => {
            const before = parse("x = y");
            const after = parse("x * 5 = y * 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying both sides by the same value",
            ]);
        });

        it("x * 10 = y * 15 -> x * 10 * 5 = y * 15 * 5", () => {
            const before = parse("x * 10 = y * 15");
            const after = parse("x * 10 * 5 = y * 15 * 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying both sides by the same value",
            ]);
        });
    });

    describe("dividing both sides", () => {
        it("x = y -> x / 5 = y / 5", () => {
            const before = parse("x = y");
            const after = parse("x / 5 = y / 5");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing both sides by the same value",
            ]);
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            const before = parse("x = y");
            const after = parse("x / 5 = y / 10");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(false);
        });
    });
});
