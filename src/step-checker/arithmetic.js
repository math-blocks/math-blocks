// @flow
import * as Semantic from "../semantic.js";

export const ZERO = {
    type: "number",
    value: "0",
};

export const ONE = {
    type: "number",
    value: "1",
};

export const num = (n: number): Semantic.Number => ({
    type: "number",
    value: String(n),
});

export const div = (num: Semantic.Expression, den: Semantic.Expression) => ({
    type: "div",
    args: [num, den],
});

export const isSubtraction = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && node.subtraction;

export const isNegative = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "mul" ? node.args : [node];

export const getTerms = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "add" ? node.args : [node];

export const mul = (factors: Semantic.Expression[]): Semantic.Expression => {
    switch (factors.length) {
        case 0:
            return ONE;
        case 1:
            return factors[0];
        default:
            return {
                type: "mul",
                implicit: false,
                args: factors,
            };
    }
};

export const add = (terms: Array<Semantic.Expression>): Semantic.Expression => {
    switch (terms.length) {
        case 0:
            return ZERO;
        case 1:
            return terms[0];
        default:
            return {
                type: "add",
                args: terms,
            };
    }
};

export const neg = (arg: Semantic.Expression): Semantic.Neg => ({
    type: "neg",
    subtraction: false,
    args: [arg],
});
