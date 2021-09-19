import * as Semantic from "@math-blocks/semantic";

import {isNegative} from "../util";

import type {Step} from "../../types";

const {NodeType} = Semantic;

// This transform should go at the top of the simplify stack so that other
// transforms that work with `mul` nodes don't have to handle as many cases.
//
// In specific situations where the negative is at the start and there's only
// one negative we can and should elide the step.  The reason for eliding it is
// that the resulting editor AST produced by editor-printer is the same for both.
// (-a)(b)(c) -> -abc (elide)
// -(1 / 6) * 6 -> -(1 / 6 * 6) (elide)
// (a)(b)(-c) -> -abc
// (-a)(b)(-c) -> abc
// (-a)(-b)(-c) -> -abc
// 1x -> x
// -1x -> -x
export function simplifyMul(
    node: Semantic.types.NumericNode,
    path: readonly Semantic.types.NumericNode[],
): Step<Semantic.types.NumericNode> | void {
    if (node.type !== NodeType.Mul) {
        return undefined;
    }

    let changed = false;
    for (const arg of node.args) {
        if (arg.type === NodeType.Neg) {
            changed = true;
            break;
        }
    }

    // This seems like a weird exception to have on this function
    if (node.args.some((f) => f.type === NodeType.Add)) {
        return undefined;
    }

    const factors = Semantic.util
        .getFactors(node)
        .map((f) => (f.type === NodeType.Neg ? f.arg : f));

    const one = Semantic.builders.number("1");
    const newFactors = factors.filter((f) => !Semantic.util.deepEquals(one, f));

    changed = changed || newFactors.length < factors.length;

    if (!changed) {
        return undefined;
    }

    const newProd = Semantic.builders.mul(newFactors, node.implicit);

    const after = isNegative(node)
        ? Semantic.builders.neg(newProd, false)
        : newProd;

    return {
        message: "simplify multiplication",
        before: node,
        after,
        substeps: [],
    };
}
