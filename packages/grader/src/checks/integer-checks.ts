import {builders, types, util} from "@math-blocks/semantic";

import {Result, Check, Step} from "../types";
import {correctResult} from "./util";

function notNull<T>(x: T | null): x is T {
    return x !== null;
}

// a + -a -> 0
export const addInverse: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type !== "add") {
        return;
    }

    const indicesToRemove: number[] = [];
    const terms = util.getTerms(prev);
    const beforeSteps: Step[] = [];

    // TODO: extract this code into a helper so that we can test it better
    for (let i = 0; i < terms.length; i++) {
        for (let j = 0; j < terms.length; j++) {
            if (i === j) {
                continue;
            }
            const a = terms[i];
            const b = terms[j];
            if (util.isNegative(b)) {
                const result = checker.checkStep(a, b.arg, context);
                if (
                    result &&
                    // Avoid removing a term that matches a term that's
                    // already been removed.
                    !indicesToRemove.includes(i) &&
                    !indicesToRemove.includes(j)
                ) {
                    indicesToRemove.push(i);
                    indicesToRemove.push(j);
                    beforeSteps.push(...result.steps);
                }
            }
        }
    }
    // TODO: introduce a commutative step so that the pairs of terms being
    // removed are beside each other.

    // We convert every even indexed one to zero and remove every odd indexed one.
    if (indicesToRemove.length > 0) {
        const newPrev = builders.add(
            terms
                .map((term: types.NumericNode, index: number) => {
                    if (indicesToRemove.includes(index)) {
                        if (indicesToRemove.indexOf(index) % 2 === 0) {
                            return builders.number("0");
                        } else {
                            return null;
                        }
                    } else {
                        return term;
                    }
                })
                .filter(notNull),
        );
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                beforeSteps,
                result.steps,
                "adding inverse",
            );
        }
    }

    return;
};
addInverse.symmetric = true;

export const doubleNegative: Check = (prev, next, context) => {
    const {checker} = context;

    if (!util.isNumeric(prev)) {
        return;
    }

    if (util.isNegative(prev) && util.isNegative(prev.arg)) {
        const newPrev = prev.arg.arg;
        const result = checker.checkStep(newPrev, next, context);
        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "negative of a negative is positive",
            );
        }
    }

    return;
};

doubleNegative.symmetric = true;

export const subIsNeg: Check = (prev, next, context) => {
    const {checker} = context;

    const results: Result[] = [];

    if (prev.type === "add") {
        const subs: types.Neg[] = prev.args.filter(util.isSubtraction);

        // We iterate through all args that are subtraction and compute
        // their result so that we can pick the shortest set of steps below.
        for (const sub of subs) {
            const index = prev.args.indexOf(sub);
            const neg = builders.neg(sub.arg);
            const newPrev = builders.add([
                ...prev.args.slice(0, index),
                neg,
                ...prev.args.slice(index + 1),
            ]);

            const result = checker.checkStep(newPrev, next, context);
            if (result) {
                results.push(
                    correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "subtracting is the same as adding the inverse",
                    ),
                );
            }
        }
    }

    // If there are multiple results, pick the one with the shortest number
    // of steps.
    if (results.length > 0) {
        let shortestResult = results[0];
        for (const result of results.slice(1)) {
            if (result.steps.length < shortestResult.steps.length) {
                shortestResult = result;
            }
        }
        return shortestResult;
    }

    return;
};

subIsNeg.symmetric = true;

// TODO: have different messages based on direction
export const negIsMulNegOne: Check = (prev, next, context) => {
    const {checker} = context;

    // Avoid infinite recursion with self.
    if (prev.source === "negIsMulNegOne" || next.source === "negIsMulNegOne") {
        return;
    }

    if (
        prev.type === "neg" &&
        !prev.subtraction &&
        // exclude -1 to avoid an infinite expansion
        !(prev.arg.type == "number" && prev.arg.value == "1")
    ) {
        const newPrev = builders.mul(
            [builders.neg(builders.number("1")), ...util.getFactors(prev.arg)],
            true,
        );

        const result = checker.checkStep(newPrev, next, context);
        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "negation is the same as multipling by negative one",
            );
        }
    } else if (prev.type === "add") {
        let changed = false;
        const newArgs = prev.args.map((arg) => {
            if (
                arg.type === "neg" &&
                !arg.subtraction &&
                // exclude -1 to avoid an infinite expansion
                !(arg.arg.type == "number" && arg.arg.value == "1")
            ) {
                const newArg = builders.mul(
                    [
                        builders.neg(builders.number("1")),
                        ...util.getFactors(arg.arg),
                    ],
                    true,
                );
                newArg.source = "negIsMulNegOne";
                changed = true;
                return newArg;
            }
            return arg;
        });

        if (!changed) {
            return;
        }

        const newPrev = builders.add(newArgs);

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "negation is the same as multipling by negative one",
            );
        }
    }

    return;
};

negIsMulNegOne.symmetric = true;

export const mulTwoNegsIsPos: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === "mul" && next.type === "mul") {
        const factors: TwoOrMore<types.NumericNode> = [...prev.args];

        const negIndices: number[] = [];

        for (let i = 0; i < factors.length; i++) {
            const factor = factors[i];
            if (factor.type === "neg") {
                negIndices.push(i);
            }
        }

        if (negIndices.length < 2) {
            return;
        }

        // If we have an odd number of negative indices remove the last one.
        if (negIndices.length % 2 === 1) {
            negIndices.pop();
        }

        const newFactors = (factors.map((factor, index) => {
            return negIndices.includes(index) && factor.type === "neg"
                ? factor.arg
                : factor;
        }) as unknown) as TwoOrMore<types.NumericNode>;

        const newPrev = builders.mul(newFactors);

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "multiplying two negatives is a positive",
                "a positive is the same as multiplying two negatives",
            );
        }
    }
};

mulTwoNegsIsPos.symmetric = true;

/**
 * This is kind of a weird rule in that it's not normally something that people
 * would show when working through steps manually.  It's necessary though to
 * handle distribution involving negatives.
 *
 * example: (x)(-y) -> -xy
 *
 * A more detailed version of this would be:
 * (x)(-y) -> (x)(-1)(y) -> (-1)(x)(y) -> -xy
 *
 * @param prev
 * @param next
 * @param context
 */
export const moveNegToFirstFactor: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === "mul" && prev.args[0].type !== "neg") {
        const factors: TwoOrMore<types.NumericNode> = [...prev.args];
        const index = factors.findIndex((factor) => factor.type === "neg");

        // If there are no negatives then we can't transfer a negative
        if (index === -1) {
            return;
        }

        const newFactors = (factors.map((f, i) => {
            if (i === 0) {
                return builders.neg(f);
            } else if (i === index && f.type === "neg") {
                return f.arg;
            } else {
                return f;
            }
        }) as unknown) as TwoOrMore<types.NumericNode>;

        const newPrev = builders.mul(newFactors);
        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "move negative to first factor",
            );
        }
    }

    return;
};
moveNegToFirstFactor.symmetric = true;

export const moveNegInsideMul: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === "neg" && !prev.subtraction && prev.arg.type === "mul") {
        const mul = prev.arg;

        const newPrev = builders.mul(
            [builders.neg(mul.args[0]), ...mul.args.slice(1)],
            prev.arg.implicit,
        );

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "move negation inside multiplication",
                "move negation out of multiplication",
            );
        }
    } else if (prev.type === "add") {
        let changed = false;
        const newArgs = prev.args.map((arg) => {
            if (
                arg.type === "neg" &&
                !arg.subtraction &&
                arg.arg.type === "mul"
            ) {
                const mul = arg.arg;
                const newArg = builders.mul(
                    [builders.neg(mul.args[0]), ...mul.args.slice(1)],
                    mul.implicit,
                );
                changed = true;
                return newArg;
            }
            return arg;
        });

        if (!changed) {
            return;
        }

        const newPrev = builders.add(newArgs);

        const result = checker.checkStep(newPrev, next, context);

        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "move negation inside multiplication",
                "move negation out of multiplication",
            );
        }
    }
};
moveNegInsideMul.symmetric = true;
