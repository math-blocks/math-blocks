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

        // This should never happen since if all the factors are the same,
        // checkArgs would've returned a successful result before we get here.
        if (uniquePrevFactors.length === 0) {
            return;
        }

        // NOTE: we use deepEquals instead of using checkStep to see if things
        // are equivalent.  We should probably do this elsewhere and rely more
        // on a fallback.  It's unlikely that a human would jump from something
        // equivalent to the 'base' to using that 'base' in a exponent node.
        const count = uniquePrevFactors.reduce(
            (count, f) => (deepEquals(f, base) ? count + 1 : count),
            0,
        );

        // This can happen when there are no previous factors that equal
        // the base we're looking for
        if (count === 0) {
            return;
        }

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

                const result = checker.checkStep(newPrev, next, context);

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
expMul.symmetric = true;

// (a^n)/(a^m) -> a^(n-m)
export const expDiv: Check = (prev, next, context) => {
    if (prev.type !== "div") {
        return;
    }

    const {checker} = context;

    const [numerator, denominator] = prev.args;

    if (
        isExponent(numerator) &&
        isExponent(denominator) &&
        deepEquals(numerator.base, denominator.base)
    ) {
        // TODO: It would be sweet if we had a way to template expressions so
        // that we could do: `${base}^(${numerator.exp}-${denominator.exp})`
        const newPrev = Semantic.exp(
            numerator.base,
            Semantic.add([numerator.exp, Semantic.neg(denominator.exp, true)]),
        );

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "dividing powers subtracts their exponents",
            );
        }
    }

    return undefined;
};
expDiv.symmetric = true;

// a^(-n) -> 1 / a^n
/**
 * Try to convert a exponent to a fraction.  If that isn't possible return
 * undefined.
 */
export const convertNegExpToDiv = (
    prev: Semantic.Types.NumericNode,
): Semantic.Types.NumericNode | undefined => {
    if (!isExponent(prev) || !Semantic.isNegative(prev.exp)) {
        return;
    }

    return Semantic.div(
        Semantic.number("1"),
        Semantic.exp(prev.base, prev.exp.arg),
    );
};

/**
 * If prev is an exponent, try to convert it to a fraction.  If that conversion
 * is successful, check if that fraction is equivalent to next.
 */
export const powNegExp: Check = (prev, next, context) => {
    // TODO: make Check generic so that we only have to check call isNumeric()
    // once in checkStep().
    if (!Semantic.isNumeric(prev)) {
        return;
    }

    const newPrev = convertNegExpToDiv(prev);

    if (!newPrev) {
        return;
    }

    const {checker} = context;
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            // TODO: Create enums for all of the reasons so that it's easy to change the message later
            "A power with a negative exponent is the same as one over the power with the positive exponent",
        );
    }

    return undefined;
};
powNegExp.symmetric = true;

// (a^n)^m -> a^(n*m)
export const powOfPow: Check = (prev, next, context) => {
    if (!isExponent(prev)) {
        return;
    }

    if (!isExponent(prev.base)) {
        return;
    }

    const {checker} = context;
    const newPrev = Semantic.exp(
        prev.base.base,
        Semantic.mul([
            // handle situations like (x^(ab))^(cd)
            ...Semantic.getFactors(prev.base.exp),
            ...Semantic.getFactors(prev.exp),
        ] as TwoOrMore<Semantic.Types.NumericNode>),
    );

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "raising a power to another exponent is the same raising the power once an multiplying the exponents",
        );
    }

    return undefined;
};
powOfPow.symmetric = true;

// TODO: include roots in this file as well
