import * as Semantic from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {isNegative} from "../util";

const {deepEquals} = Semantic;

// This transform should go at the top of the simplify stack so that other
// transforms that work with `mul` nodes don't have to handle as many cases.
//
// (-a)(b)(c) -> -abc
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

    const factors = Semantic.getFactors(before).map((f) =>
        f.type === "neg" ? f.arg : f,
    );

    const one = Semantic.number("1");
    const newFactors = factors.filter((f) => !deepEquals(one, f));

    changed = changed || newFactors.length < factors.length;

    if (!changed) {
        return undefined;
    }

    const newProd = Semantic.mulFactors(newFactors, true);

    const after = isNegative(before) ? Semantic.neg(newProd, false) : newProd;

    return {
        message: "simplify multiplication",
        before,
        after,
        substeps: [],
    };
};
