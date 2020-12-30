import * as Semantic from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {isNegative} from "../util";

// This transform should go at the top of the simplify stack so that other
// transforms that work with `mul` nodes don't have to handle as many cases.
//
// (-a)(b)(c) -> -abc
// (a)(b)(-c) -> -abc
// (-a)(b)(-c) -> abc
// (-a)(-b)(-c) -> -abc
export const simplifyMul: Transform = (before, path): Step | undefined => {
    if (before.type !== "mul") {
        return undefined;
    }

    if (!before.args.some((f) => f.type === "neg")) {
        return undefined;
    }

    if (before.args.some((f) => f.type === "add")) {
        return undefined;
    }

    const factors = Semantic.getFactors(before).map((f) =>
        f.type === "neg" ? f.arg : f,
    );

    const after = isNegative(before)
        ? Semantic.neg(Semantic.mulFactors(factors, true), false)
        : Semantic.mulFactors(factors, true);

    return {
        message: "simplify multiplication",
        before,
        after,
        substeps: [],
    };
};
