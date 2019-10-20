// @flow
import * as Semantic from "../semantic.js";
import {checkStep} from "../step-checker.js";

const add = (...args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (...args: Semantic.Expression[]): Semantic.Mul => ({
    type: "mul",
    implicit: false,
    args,
});

const eq = (...args: Semantic.Expression[]): Semantic.Eq => ({
    type: "eq",
    args,
});

const number = (value: string): Semantic.Number => ({
    type: "number",
    value,
});

const ident = (name: string): Semantic.Identifier => ({
    type: "identifier",
    name,
});

// a + b -> b + a

describe.only("transforms", () => {
    it("addition in the wrong order are equivalent", () => {
        const before = add(number("1"), number("2"));
        const after = add(number("2"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);
        console.log(reasons);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("multiplication in the wrong order are equivalent", () => {
        const before = mul(number("1"), number("2"));
        const after = mul(number("2"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);
        console.log(reasons);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("equality in the wrong order are equivalent", () => {
        const before = eq(number("1"), number("2"));
        const after = eq(number("2"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);
        console.log(reasons);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["symmetric property"]);
    });

    it("should find differences deeper in the tree", () => {
        const before = add(ident("x"), add(ident("a"), number("2")));
        const after = add(ident("x"), add(number("2"), ident("a")));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("should return true if children of and 'add' node have been reordered", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("a"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("should return false if the expressions are different", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("b"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
    });

    it("addition with zero: a + 0 -> a", () => {
        const before = add(ident("a"), number("0"));
        const after = ident("a");

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("addition with zero: a -> a + 0", () => {
        const before = ident("a");
        const after = add(ident("a"), number("0"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("addition with zero: a + b -> a + b + 0", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), ident("b"), number("0"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("addition with zero: any number of args, zero anywhere", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("addition with zero: any number of args, any number of zeros", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"), number("0"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("multiplication by 1", () => {
        const before = mul(ident("a"), number("1"));
        const after = ident("a");

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("multiplication by 1 reversed", () => {
        const before = ident("a");
        const after = mul(ident("a"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("multiplication by on: any number of args, any number of ones", () => {
        const before = mul(ident("a"), ident("b"));
        const after = mul(ident("a"), number("1"), ident("b"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });
});
