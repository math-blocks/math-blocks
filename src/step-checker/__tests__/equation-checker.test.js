// @flow
import * as Semantic from "../../semantic.js";

import StepChecker from "../step-checker.js";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next);

const number = (value: string): Semantic.Number => {
    if (/^[a-z]/.test(value)) {
        throw new Error("numbers can't contain letters");
    }
    return {
        type: "number",
        value,
    };
};

const ident = (name: string): Semantic.Identifier => {
    if (/^[0-9]/.test(name)) {
        throw new Error("identifiers can't start with a number");
    }
    return {
        type: "identifier",
        name,
    };
};

const eq = (...args: Semantic.Expression[]): Semantic.Eq => ({
    type: "eq",
    args,
});

const add = (...args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const sub = (arg: Semantic.Expression): Semantic.Neg => ({
    type: "neg",
    subtraction: true,
    args: [arg],
});

const mul = (...args: Semantic.Expression[]): Semantic.Mul => ({
    type: "mul",
    implicit: false,
    args,
});

const div = (
    numerator: Semantic.Expression,
    denominator: Semantic.Expression,
): Semantic.Div => ({
    type: "div",
    args: [numerator, denominator],
});

describe("EquationChecker", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(ident("x"), number("5")),
                add(ident("y"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> 5 + x = y + 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(number("5"), ident("x")),
                add(ident("y"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const before = eq(
                add(ident("x"), number("10")),
                add(ident("y"), number("15")),
            );
            const after = eq(
                add(ident("x"), number("10"), number("5")),
                add(ident("y"), number("15"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(ident("x"), sub(number("5"))),
                add(ident("y"), sub(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const before = eq(
                add(ident("x"), number("10")),
                add(ident("y"), number("15")),
            );
            const after = eq(
                add(ident("x"), number("10"), sub(number("5"))),
                add(ident("y"), number("15"), sub(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("should work when each side is an atom", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                mul(ident("x"), sub(number("5"))),
                mul(ident("y"), sub(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying both sides by the same value",
            ]);
        });

        it("should work when each side is an mul node", () => {
            const before = eq(
                mul(ident("x"), number("10")),
                mul(ident("y"), number("15")),
            );
            const after = eq(
                mul(ident("x"), number("10"), sub(number("5"))),
                mul(ident("y"), number("15"), sub(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying both sides by the same value",
            ]);
        });
    });

    describe("dividing both sides", () => {
        it("should work when each side is an atom", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                div(ident("x"), sub(number("5"))),
                div(ident("y"), sub(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing both sides by the same value",
            ]);
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                div(ident("x"), sub(number("5"))),
                div(ident("y"), sub(number("10"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(false);
        });
    });
});
