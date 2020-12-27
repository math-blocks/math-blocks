import * as Semantic from "@math-blocks/semantic";
import {
    deepEquals,
    evalNode,
    number,
    isNumber,
    getFactors,
    mulFactors,
} from "@math-blocks/semantic";
import {Step} from "./types";

// TODO: backport the change to @math-blocks/semantic
// We want three checks:
// - is it negative
// - is it subtraction
// - is it negative and not subtraction
export const isNegative = (node: Semantic.Types.NumericNode): boolean => {
    node; // ?
    if (node.type === "neg") {
        return !isNegative(node.arg);
    }
    if (node.type === "mul") {
        let count = 0;
        for (const factor of node.args) {
            if (isNegative(factor)) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    return false;
};

const mulNegOneSubstep = (
    a: Semantic.Types.NumericNode,
    b: Semantic.Types.NumericNode,
    substeps?: Step[], // NOTE: this array is modified
): void => {
    // -1a -> -a
    if (
        deepEquals(a, Semantic.number("-1")) &&
        !isNegative(b) &&
        !isNumber(b) // We exclude numbers from this substep since they're handled separately
    ) {
        substeps?.push({
            message: "multiplication by -1 is the same as being negative",
            // It would be nice if we didn't have to recreate this node here
            // since doing so complicates reporting
            before: Semantic.mul([a, b], true),
            after: Semantic.neg(b),
            substeps: [],
        });
    }

    // (a)(-1) -> -a
    if (
        deepEquals(b, Semantic.number("-1")) &&
        !isNegative(a) &&
        !isNumber(a) // We exclude numbers from this substep since they're handled separately
    ) {
        substeps?.push({
            message: "multiplication by -1 is the same as being negative",
            // It would be nice if we didn't have to recreate this node here
            // since doing so complicates reporting
            before: Semantic.mul([a, b], true),
            after: Semantic.neg(a),
            substeps: [],
        });
    }
};

const mulOneSubstep = (
    a: Semantic.Types.NumericNode,
    b: Semantic.Types.NumericNode,
    substeps?: Step[], // NOTE: this array is modified
): void => {
    // 1a -> a
    if (
        deepEquals(a, Semantic.number("1")) &&
        !isNumber(b) // We exclude numbers from this substep since they're handled separately
    ) {
        substeps?.push({
            message: "multiplication by 1 is a no-op",
            // It would be nice if we didn't have to recreate this node here
            // since doing so complicates reporting
            before: Semantic.mul([a, b], true),
            after: b,
            substeps: [],
        });
    }

    // (a)(1) -> a
    if (
        deepEquals(b, Semantic.number("1")) &&
        !isNumber(a) // We exclude numbers from this substep since they're handled bseparatelylow
    ) {
        substeps?.push({
            message: "multiplication by 1 is a no-op",
            // It would be nice if we didn't have to recreate this node here
            // since doing so complicates reporting
            before: Semantic.mul([a, b], true),
            after: a,
            substeps: [],
        });
    }
};

export const mul = (
    a: Semantic.Types.NumericNode,
    b: Semantic.Types.NumericNode,
    substeps?: Step[], // NOTE: this array is modified
): Semantic.Types.NumericNode => {
    const aFactors: Semantic.Types.NumericNode[] =
        a.type === "neg" ? getFactors(a.arg) : getFactors(a);
    const bFactors: Semantic.Types.NumericNode[] =
        b.type === "neg" ? getFactors(b.arg) : getFactors(b);

    // It's okay to reuse this since we're only using it for comparison
    const one: Semantic.Types.Num = {
        id: -1,
        type: "number",
        value: "1",
    };

    // TODO: add substeps for special cases
    // (-1)(a) -> -a (multiplying by -1 is the same as being negative one)
    // (1)(1) -> 1 (evaluate multiplication)

    const isResultNegative = isNegative(a) !== isNegative(b);

    if (a.type === "neg") {
        aFactors[0] = Semantic.neg(aFactors[0]);
    }

    if (b.type === "neg") {
        bFactors[0] = Semantic.neg(bFactors[0]);
    }

    if (substeps) {
        mulNegOneSubstep(a, b, substeps);
        mulOneSubstep(a, b, substeps);
    }

    const numberFactors = [
        ...aFactors.filter(isNumber),
        ...bFactors.filter(isNumber),
    ];

    const nonNumberFactors = [
        ...aFactors.filter((f) => !isNumber(f)),
        ...bFactors.filter((f) => !isNumber(f)),
    ];

    let coeff: Semantic.Types.NumericNode;
    if (numberFactors.length === 0) {
        coeff = one;
    } else if (numberFactors.length === 1) {
        coeff = numberFactors[0];
    } else {
        const before = Semantic.mulFactors(numberFactors, true);
        const after = number(evalNode(before).toString());
        substeps?.push({
            message: "evaluate multiplication",
            before,
            after,
            substeps: [],
        });
        coeff = after;
    }

    let factors =
        deepEquals(coeff, one) || deepEquals(coeff, Semantic.neg(one))
            ? nonNumberFactors
            : [coeff, ...nonNumberFactors];

    factors = factors.map((f) => (f.type === "neg" ? f.arg : f));

    return isResultNegative
        ? Semantic.neg(mulFactors(factors, true))
        : mulFactors(factors, true);
};
