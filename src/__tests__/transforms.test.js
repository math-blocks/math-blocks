// @flow
import * as Semantic from "../semantic.js";
import {compare} from "../transforms.js";

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
        const result = compare(before, after, reasons);
        console.log(reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["commutative property"]);
    });

    it("multiplication in the wrong order are equivalent", () => {
        const before = mul(number("1"), number("2"));
        const after = mul(number("2"), number("1"));

        const reasons = [];
        const result = compare(before, after, reasons);
        console.log(reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["commutative property"]);
    });

    it("equality in the wrong order are equivalent", () => {
        const before = eq(number("1"), number("2"));
        const after = eq(number("2"), number("1"));

        const reasons = [];
        const result = compare(before, after, reasons);
        console.log(reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["symmetric property"]);
    });

    it("should find differences deeper in the tree", () => {
        const before = add(ident("x"), add(ident("a"), number("2")));
        const after = add(ident("x"), add(number("2"), ident("a")));

        const reasons = [];
        const result = compare(before, after, reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["commutative property"]);
    });

    it("should return true if children of and 'add' node have been reordered", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("a"));

        const reasons = [];
        const result = compare(before, after, reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["commutative property"]);
    });

    it("should return false if the expressions are different", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("b"));

        const reasons = [];
        const result = compare(before, after, reasons);

        expect(result).toBe(false);
    });

    it("addition with zero", () => {
        const before = add(ident("a"), number("0"));
        const after = ident("a");

        const reasons = [];
        const result = compare(before, after, reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["addition with identity"]);
    });

    it("addition with zero", () => {
        const before = ident("a");
        const after = add(ident("a"), number("0"));

        const reasons = [];
        const result = compare(before, after, reasons);

        expect(result).toBe(true);
        expect(reasons).toEqual(["addition with identity"]);
    });
});
