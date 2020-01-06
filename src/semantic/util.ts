/**
 * Builder functions and helper methods for working
 * with semantic nodes.
 */
import * as Semantic from "./semantic";
import {getId} from "../unique-id";

export const identifier = (name: string): Semantic.Ident => ({
    type: "identifier",
    id: getId(),
    name,
});

export const number = (value: string): Semantic.Num => ({
    type: "number",
    id: getId(),
    value,
});

export const ellipsis = (): Semantic.Ellipsis => ({
    type: "ellipsis",
    id: getId(),
});

export const add = (args: TwoOrMore<Semantic.Expression>): Semantic.Add => ({
    type: "add",
    id: getId(),
    args,
});

export const mul = (
    args: TwoOrMore<Semantic.Expression>,
    implicit = false,
): Semantic.Mul => ({
    type: "mul",
    id: getId(),
    implicit,
    args,
});

export const eq = (args: TwoOrMore<Semantic.Expression>): Semantic.Eq => ({
    type: "eq",
    id: getId(),
    args,
});

export const neg = (
    arg: Semantic.Expression,
    subtraction = false,
): Semantic.Neg => ({
    type: "neg",
    id: getId(),
    arg,
    subtraction,
});

export const div = (
    num: Semantic.Expression,
    den: Semantic.Expression,
): Semantic.Div => ({
    type: "div",
    id: getId(),
    args: [num, den],
});

export const exp = (
    base: Semantic.Expression,
    exp: Semantic.Expression,
): Semantic.Exp => ({
    type: "exp",
    id: getId(),
    base,
    exp,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
export const root = (
    radicand: Semantic.Expression,
    index?: Semantic.Expression,
): Semantic.Root => ({
    type: "root",
    id: getId(),
    radicand,
    index: index || number("2"),
});

export const isSubtraction = (
    node: Semantic.Expression,
): node is Semantic.Neg => node.type === "neg" && node.subtraction;

export const isNegative = (node: Semantic.Expression): node is Semantic.Neg =>
    node.type === "neg" && !node.subtraction;

export const getFactors = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "mul" ? node.args : [node];

export const getTerms = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "add" ? node.args : [node];

export const mulFactors = (
    factors: Semantic.Expression[],
): Semantic.Expression => {
    switch (factors.length) {
        case 0:
            return number("1");
        case 1:
            return factors[0];
        default:
            return {
                type: "mul",
                id: getId(),
                implicit: false,
                args: factors as TwoOrMore<Semantic.Expression>,
            };
    }
};

export const addTerms = (
    terms: Array<Semantic.Expression>,
): Semantic.Expression => {
    switch (terms.length) {
        case 0:
            return number("0");
        case 1:
            return terms[0];
        default:
            return {
                type: "add",
                id: getId(),
                args: terms as TwoOrMore<Semantic.Expression>,
            };
    }
};
