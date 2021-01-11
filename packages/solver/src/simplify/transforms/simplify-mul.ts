import {builders, util} from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {isNegative} from "../util";

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
export const simplifyMul: Transform = (before, path): Step | undefined => {
    if (before.type !== "mul") {
        return undefined;
    }

    let changed = false;
    for (const arg of before.args) {
        if (arg.type === "neg") {
            changed = true;
            break;
        }
    }

    // This seems like a weird exception to have on this function
    if (before.args.some((f) => f.type === "add")) {
        return undefined;
    }

    const factors = util
        .getFactors(before)
        .map((f) => (f.type === "neg" ? f.arg : f));

    const one = builders.number("1");
    const newFactors = factors.filter((f) => !util.deepEquals(one, f));

    changed = changed || newFactors.length < factors.length;

    if (!changed) {
        return undefined;
    }

    const newProd = builders.mul(newFactors, before.implicit);

    const after = isNegative(before) ? builders.neg(newProd, false) : newProd;

    return {
        message: "simplify multiplication",
        before,
        after,
        substeps: [],
    };
};
