import * as Semantic from "@math-blocks/semantic";
import {getId} from "@math-blocks/core";

import {Check} from "../types";

import {correctResult, difference} from "./util";
import {exactMatch} from "./basic-checks";
import {convertPowNegExpToDiv} from "./power-checks";

// TODOs:
// - Many of these checks use exactMatch (aka deepEquals) which may exclude
//   certain valid paths.  Try to come up with some test cases where we'd need
//   to use exactMatch.

// a * b/c -> ab / c
// a/b * c/d * e -> ace / bd
// NOTE: This step multiplies all fractions in a 'mul' node and doesn't handle
// situations where a student might multiply two of the factors in one step and
// more of the factors in the next step.
export const mulFrac: Check = (prev, next, context) => {
    // Avoid infinite loops with divIsMulByOneOver
    if (
        prev.source === "divIsMulByOneOver" ||
        next.source === "divIsMulByOneOver"
    ) {
        return;
    }

    if (prev.type !== "mul") {
        return;
    }

    // If none of the args are 'div' nodes then there are no fractions to
    // multiply by.
    if (!prev.args.find((arg) => arg.type === "div")) {
        return;
    }

    const {checker} = context;

    const isNotOne = (node: Semantic.Types.NumericNode): boolean =>
        !exactMatch(node, Semantic.number("1"), context);

    const numerators: Semantic.Types.NumericNode[] = [];
    const denominators: Semantic.Types.NumericNode[] = [];

    for (const arg of prev.args) {
        if (arg.type === "div") {
            numerators.push(arg.args[0]);
            denominators.push(arg.args[1]);
        } else {
            numerators.push(arg);
        }
    }

    const newPrev = Semantic.div(
        Semantic.mulFactors(numerators.filter(isNotOne)),
        Semantic.mulFactors(denominators.filter(isNotOne)),
    );
    newPrev.source = "mulFrac";

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            // TODO: come up with better prose
            "multiplication of fractions",
            "fraction decomposition",
        );
    }
};
mulFrac.symmetric = true;

// This check is the dual of 'mulFrac'.  The reason why we need both even though
// all of our checks are symmetric, is that a symmetric check only works if the
// 'next' we pass to the top-level 'checkStep' matches the form that we expect
// for 'prev'.  It doesn't help when that form is an internal node inside a
// multi-step path.  NOTE: This isn't an exactly dual though.  'mulFrac' can
// handle things like 'a * b/c * c/d -> abc / cd' (and its reverse) whereas this
// check can only go from 'abc / cd -> abc * 1/cd'.
export const divIsMulByOneOver: Check = (prev, next, context) => {
    // Avoid infinite loops with mulFrac
    if (prev.source === "mulFrac" || next.source === "mulFrac") {
        return;
    }

    if (prev.type !== "div") {
        return;
    }

    // Don't bother expanding 1/a
    if (exactMatch(prev.args[0], Semantic.number("1"), context)) {
        return;
    }

    const {checker} = context;

    const newPrev = Semantic.mul([
        prev.args[0], // should we clone this?
        Semantic.div(Semantic.number("1"), prev.args[1]),
    ]);
    newPrev.source = "divIsMulByOneOver";

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "division is multiplication by a fraction", // TODO: come up with better prose
        );
    }
};

// a / b/c -> a * c/b
export const divByFrac: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type !== "div") {
        return;
    }

    const [numerator, denominator] = prev.args;

    if (denominator.type === "div") {
        // If the numerator and denominator of the fraction we're dividing by
        // are the same then flipping them won't do anything.
        if (exactMatch(denominator.args[0], denominator.args[1], context)) {
            return;
        }

        const reciprocal = Semantic.div(
            denominator.args[1],
            denominator.args[0],
        );

        const newPrev = Semantic.mulFactors([numerator, reciprocal]);
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "dividing by a fraction is the same as multiplying by the reciprocal",
            );
        }
    }

    // If the denominator wasn't a fraction, try to convert it to a fraction.
    // TODO: find any other checks where prev is not a fraction but newPrev is.
    // Run those checks here as well if convertPowNegExpToDiv fails.
    // TODO: extract conversion functions from each check so it's easier to see
    // what conversions are available.
    const newDenominator = convertPowNegExpToDiv(denominator);
    if (!newDenominator) {
        return;
    }

    // We need a helper like correctResult but one that appends to the result.
    const newPrev = Semantic.div(numerator, newDenominator);
    const result = divByFrac(newPrev, next, context);

    if (result) {
        if (context.reversed) {
            result.steps.push({
                message:
                    "A power with a negative exponent is the same as one over the power with the positive exponent",
                nodes: [newDenominator, denominator],
            });
        } else {
            result.steps.unshift({
                message:
                    "A power with a negative exponent is the same as one over the power with the positive exponent",
                nodes: [denominator, newDenominator],
            });
        }

        return result;
    }
};
divByFrac.symmetric = true;

// NOTE: This check currently cancels everything and doens't handle situations
// where a student might cancel some things in one step and more things in the
// next step.
// ab / bc -> a / c
// ab / b -> a
// ab / abc -> 1 / c
export const cancelFrac: Check = (prev, next, context) => {
    if (prev.type !== "div") {
        return;
    }

    const {checker} = context;

    const isNotOne = (node: Semantic.Types.NumericNode): boolean =>
        !exactMatch(node, Semantic.number("1"), context);

    // Filter out the "1"s
    const numerators = Semantic.getFactors(prev.args[0]).filter(isNotOne);
    const denominators = Semantic.getFactors(prev.args[1]).filter(isNotOne);

    const remainingNumerators = difference(numerators, denominators);
    const remainingDenominators = difference(denominators, numerators);

    // If there's nothing to cancel return
    if (
        numerators.length === remainingNumerators.length &&
        denominators.length === remainingDenominators.length
    ) {
        return;
    }

    let newPrev: Semantic.Types.NumericNode;
    if (
        remainingNumerators.length === 0 &&
        remainingDenominators.length === 0
    ) {
        newPrev = Semantic.number("1");
    } else if (remainingDenominators.length === 0) {
        newPrev = Semantic.mulFactors(remainingNumerators);
    } else if (remainingNumerators.length === 0) {
        newPrev = Semantic.div(
            Semantic.number("1"),
            Semantic.mulFactors(remainingDenominators),
        );
    } else {
        newPrev = Semantic.div(
            Semantic.mulFactors(remainingNumerators),
            Semantic.mulFactors(remainingDenominators),
        );
    }

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "cancelling in fractions", // TODO: come up with better prose
        );
    }
};
cancelFrac.symmetric = true;

export const divByOne: Check = (prev, next, context) => {
    const {checker} = context;
    if (prev.type === "div") {
        const result1 = checker.checkStep(
            prev.args[1],
            Semantic.number("1"),
            context,
        );
        if (result1) {
            // Clone prev.args[0] and give it a new id.  If we don't,
            // `correctResults` will change it when it applies steps from
            // result1.
            const newPrev = {
                ...prev.args[0],
                id: getId(),
            };
            const result2 = checker.checkStep(newPrev, next, context);

            if (result2) {
                return correctResult(
                    prev,
                    newPrev,
                    context.reversed,
                    result1.steps,
                    result2.steps,
                    "division by one",
                );
            }
        }
    }
};
divByOne.symmetric = true;

export const mulInverse: Check = (prev, next, context) => {
    if (prev.type !== "mul") {
        return undefined;
    }

    const {checker} = context;

    const pairs: [
        Semantic.Types.NumericNode,
        Semantic.Types.NumericNode,
    ][] = [];
    for (let i = 0; i < prev.args.length - 1; i++) {
        pairs.push([prev.args[i], prev.args[i + 1]]);
    }

    for (let i = 0; i < prev.args.length - 1; i++) {
        const pair = pairs[i];
        // a * 1/a -> 1
        if (pair[0].type !== "div" && pair[1].type === "div") {
            if (exactMatch(pair[0], pair[1].args[1], context)) {
                const newPrev = Semantic.mulFactors(
                    [
                        ...prev.args.slice(0, i),
                        Semantic.number("1"),
                        ...prev.args.slice(i + 2),
                    ],
                    prev.implicit,
                );

                const result = checker.checkStep(newPrev, next, context);

                if (result) {
                    return correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "multiplying the inverse",
                    );
                }
            }
        }

        // 1/a * a -> 1
        if (pair[0].type === "div" && pair[1].type !== "div") {
            if (exactMatch(pair[1], pair[0].args[1], context)) {
                const newPrev = Semantic.mulFactors(
                    [
                        ...prev.args.slice(0, i),
                        Semantic.number("1"),
                        ...prev.args.slice(i + 2),
                    ],
                    prev.implicit,
                );

                const result = checker.checkStep(newPrev, next, context);

                if (result) {
                    return correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "multiplying the inverse",
                    );
                }
            }
        }
    }

    return undefined;
};
mulInverse.symmetric = true;
