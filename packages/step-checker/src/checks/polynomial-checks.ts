import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";

import {correctResult} from "./util";
import {exactMatch} from "./basic-checks";

// 2x + 3x -> 5x
export const collectLikeTerms: Check = (prev, next, context) => {
    if (prev.type !== "add") {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        Semantic.Types.NumericNode,
        Semantic.Types.NumericNode[]
    >();

    const newTerms: Semantic.Types.NumericNode[] = [];
    const numberTerms: Semantic.Types.NumericNode[] = [];

    for (const arg of prev.args) {
        const factors = Semantic.getFactors(arg);

        if (Semantic.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: Semantic.Types.NumericNode;
        let varPart: Semantic.Types.NumericNode;

        if (Semantic.isNumber(factors[0])) {
            coeff = factors[0];
            varPart = Semantic.mulFactors(factors.slice(1), true);
        } else {
            coeff = Semantic.number("1");
            varPart = arg;
        }

        let key: Semantic.Types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (exactMatch(k, varPart, context)) {
                key = k;
            }
        }
        if (!key) {
            map.set(varPart, [coeff]);
        } else {
            map.get(key)?.push(coeff);
        }
    }

    for (const [k, v] of map.entries()) {
        if (v.length > 1) {
            newTerms.push(
                Semantic.mulFactors([
                    Semantic.addTerms(v),
                    ...Semantic.getFactors(k),
                ]),
            );
        }
    }

    // If no terms have be collected together then return early.
    if (
        newTerms.length === 0 ||
        newTerms.length + numberTerms.length === prev.args.length
    ) {
        return;
    }

    const {checker} = context;

    // Place numbers at the end which is a comment convention.
    const newPrev = Semantic.addTerms([...newTerms, ...numberTerms]);
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "collect like terms",
        );
    }

    return undefined;
};
