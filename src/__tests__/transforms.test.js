// @flow
import * as Semantic from "../semantic.js";
import {compare} from "../transforms.js";

const add = (...args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
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
    it("addition in the wrong order are different structures", () => {
        const before = add(number("1"), number("2"));
        const after = add(number("2"), number("1"));

        const result = compare(before, after);

        expect(result).toBe(true);
    });

    it("should find differences deeper in the tree", () => {
        const before = add(ident("x"), add(ident("a"), number("2")));
        const after = add(ident("x"), add(number("2"), ident("a")));

        const result = compare(before, after);

        expect(result).toBe(true);
    });
});
