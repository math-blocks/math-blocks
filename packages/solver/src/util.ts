import * as Semantic from "@math-blocks/semantic";
import {
    deepEquals,
    evalNode,
    number,
    isNumber,
    getFactors,
    mulFactors,
} from "@math-blocks/semantic";

// TODO: backport the change to @math-blocks/semantic
// We want three checks:
// - is it negative
// - is it subtraction
// - is it negative and not subtraction
const isNegative = (
    node: Semantic.Types.NumericNode,
): node is Semantic.Types.Neg => node.type === "neg";

// TODO: return sub-steps
export const mul = (
    a: Semantic.Types.NumericNode,
    b: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode => {
    let aFactors: Semantic.Types.NumericNode[] = isNegative(a)
        ? getFactors(a.arg)
        : getFactors(a);
    let bFactors: Semantic.Types.NumericNode[] = isNegative(b)
        ? getFactors(b.arg)
        : getFactors(b);

    aFactors = aFactors.filter((f) => !deepEquals(f, number("1")));
    bFactors = bFactors.filter((f) => !deepEquals(f, number("1")));

    const isResultNegative = isNegative(a) !== isNegative(b);

    const numberFactors = [
        ...aFactors.filter(isNumber),
        ...bFactors.filter(isNumber),
    ];

    const nonNumberFactors = [
        ...aFactors.filter((f) => !isNumber(f)),
        ...bFactors.filter((f) => !isNumber(f)),
    ];

    const coeff = number(evalNode(mulFactors(numberFactors)).toString());

    const factors = deepEquals(coeff, number("1"))
        ? nonNumberFactors
        : [coeff, ...nonNumberFactors];

    return isResultNegative
        ? Semantic.neg(mulFactors(factors, true))
        : mulFactors(factors, true);
};
