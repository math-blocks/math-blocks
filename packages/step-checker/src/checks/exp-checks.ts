import * as Semantic from "@math-blocks/semantic";

import {Check} from "../types";
import {correctResult, difference, intersection, deepEquals} from "./util";

const isExponent = (node: Semantic.Types.Node): node is Semantic.Types.Exp => {
    return node.type === "exp";
};

// a*a*...*a -> a^n
// TODO: make check generic and then have runChecks do some preliminary checking.
export const expDef: Check = (prev, next, context) => {
    const {checker} = context;

    if (!Semantic.isNumeric(next)) {
        return;
    }

    if (prev.type === "mul") {
        // TODO: memoize helpers like getFactors, getTerms, difference, intersection, etc.
        const prevFactors = Semantic.getFactors(prev);
        const nextFactors = Semantic.getFactors(next);

        const commonFactors = intersection(prevFactors, nextFactors);

        // TODO: also make helpers for getting unique factors/terms since we do this
        // in a number of places.
        const uniquePrevFactors = difference(prevFactors, commonFactors);
        const uniqueNextFactors = difference(nextFactors, commonFactors);

        const exps = uniqueNextFactors.filter(isExponent);

        const expsWithNumberExp = exps.filter(
            (exp) => exp.exp.type === "number",
        );

        if (expsWithNumberExp.length === 0) {
            return undefined;
        }

        const base = expsWithNumberExp[0].base;

        // NOTE: we use deepEquals instead of using checkStep to see if things
        // are equivalent.  We should probably do this elsewhere and rely more
        // on a fallback.  It's unlikely that a human would jump from something
        // equivalent to the 'base' to using that 'base' in a exponent node.
        const count = uniquePrevFactors.reduce(
            (count, f) => (deepEquals(f, base) ? count + 1 : count),
            0,
        );

        const nonBaseUniquePrevFactors = uniquePrevFactors.filter(
            (f) => !deepEquals(f, base),
        );

        // We need to do this check since there might be multiple exponents
        // with the same base in next.
        const newPrev = Semantic.mulFactors([
            ...commonFactors,
            Semantic.exp(base, Semantic.number(String(count))),
            ...nonBaseUniquePrevFactors,
        ]);
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "multiplying a factor n-times is an exponent",
            );
        }
    }

    return undefined;
};
expDef.symmetric = true;

// (a^n)(a^m) -> a^(n+m)
export const expMul: Check = (prev, next, context) => {
    const {checker} = context;

    if (!Semantic.isNumeric(next)) {
        return;
    }

    if (prev.type === "mul") {
        // TODO: memoize helpers like getFactors, getTerms, difference, intersection, etc.
        const prevFactors = Semantic.getFactors(prev);
        const nextFactors = Semantic.getFactors(next);

        const commonFactors = intersection(prevFactors, nextFactors);

        // TODO: also make helpers for getting unique factors/terms since we do this
        // in a number of places.
        const uniquePrevFactors = difference(prevFactors, commonFactors);
        const uniqueNextFactors = difference(nextFactors, commonFactors);

        const prevExps = uniquePrevFactors.filter(isExponent);
        const nextExps = uniqueNextFactors.filter(isExponent);

        for (let i = 0; i < nextExps.length; i++) {
            const nextExp = nextExps[i];
            const prevExpsWithSameBase: Semantic.Types.Exp[] = [];
            for (let j = 0; j < prevExps.length; j++) {
                const prevExp = prevExps[j];
                if (deepEquals(prevExp.base, nextExp.base)) {
                    prevExpsWithSameBase.push(prevExp);
                }
            }

            if (prevExpsWithSameBase.length > 1) {
                const base = prevExpsWithSameBase[0].base;
                const newExp = Semantic.exp(
                    base,
                    Semantic.add(
                        prevExpsWithSameBase.map((exp) => exp.exp) as TwoOrMore<
                            Semantic.Types.NumericNode
                        >,
                    ),
                );

                // remove nextExp
                const remainingNextFactors = [
                    ...nextExps.slice(0, i),
                    ...nextExps.slice(i + 1),
                ];

                const newPrev = Semantic.mulFactors([
                    ...commonFactors,
                    newExp,
                    ...remainingNextFactors,
                ]);

                const result = checker.checkStep(newPrev, next, {
                    ...context,
                    filters: {
                        disallowedChecks: new Set([expDef.name]),
                    },
                });

                if (result) {
                    return correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "multiplying powers adds their exponents",
                    );
                }
            }
        }
    }

    return undefined;
};

// (a^n)/(a^m) -> a^(n-m)
export const expDiv: Check = (prev, next, context) => {
    // TODO: implement this

    return undefined;
};
