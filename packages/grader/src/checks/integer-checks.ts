import * as Semantic from "@math-blocks/semantic";
import {Step} from "@math-blocks/step-utils";

import type {Result, Check} from "../types";

import {correctResult} from "./util";

const {NodeType} = Semantic;

function notNull<T>(x: T | null): x is T {
    return x !== null;
}

// a + -a -> 0
export const addInverse: Check = (prev, next, context): Result | undefined => {
    const {checker} = context;

    if (prev.type !== NodeType.Add) {
        return;
    }

    const indicesToRemove: number[] = [];
    const terms = Semantic.util.getTerms(prev);
    const beforeSteps: Step[] = [];

    // TODO: extract this code into a helper so that we can test it better
    for (let i = 0; i < terms.length; i++) {
        for (let j = 0; j < terms.length; j++) {
            if (i === j) {
                continue;
            }
            const a = terms[i];
            const b = terms[j];
            if (Semantic.util.isNegative(b)) {
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
        const newPrev = Semantic.builders.add(
            terms
                .map((term: Semantic.types.NumericNode, index: number) => {
                    if (indicesToRemove.includes(index)) {
                        if (indicesToRemove.indexOf(index) % 2 === 0) {
                            return Semantic.builders.number("0");
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

export const doubleNegative: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    const {checker} = context;

    if (!Semantic.util.isNumeric(prev)) {
        return;
    }

    if (Semantic.util.isNegative(prev) && Semantic.util.isNegative(prev.arg)) {
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

export const subIsNeg: Check = (prev, next, context): Result | undefined => {
    const {checker} = context;

    const results: Result[] = [];

    if (prev.type === NodeType.Add) {
        const subs: Semantic.types.Neg[] = prev.args.filter(
            Semantic.util.isSubtraction,
        );

        // We iterate through all args that are subtraction and compute
        // their result so that we can pick the shortest set of steps below.
        for (const sub of subs) {
            const index = prev.args.indexOf(sub);
            const neg = Semantic.builders.neg(sub.arg);
            const newPrev = Semantic.builders.add([
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
export const negIsMulNegOne: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    const {checker} = context;

    // Avoid infinite recursion with self.
    if (prev.source === "negIsMulNegOne" || next.source === "negIsMulNegOne") {
        return;
    }

    if (
        prev.type === NodeType.Neg &&
        !prev.subtraction &&
        // exclude -1 to avoid an infinite expansion
        !(prev.arg.type == NodeType.Number && prev.arg.value == "1")
    ) {
        const newPrev = Semantic.builders.mul(
            [
                Semantic.builders.neg(Semantic.builders.number("1")),
                ...Semantic.util.getFactors(prev.arg),
            ],
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
    } else if (prev.type === NodeType.Add) {
        let changed = false;
        const newArgs = prev.args.map((arg) => {
            if (
                arg.type === NodeType.Neg &&
                !arg.subtraction &&
                // exclude -1 to avoid an infinite expansion
                !(arg.arg.type == NodeType.Number && arg.arg.value == "1")
            ) {
                const newArg = Semantic.builders.mul(
                    [
                        Semantic.builders.neg(Semantic.builders.number("1")),
                        ...Semantic.util.getFactors(arg.arg),
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

        const newPrev = Semantic.builders.add(newArgs);

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

export const mulTwoNegsIsPos: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    const {checker} = context;

    if (prev.type === NodeType.Mul && next.type === NodeType.Mul) {
        const factors: TwoOrMore<Semantic.types.NumericNode> = [...prev.args];

        const negIndices: number[] = [];

        for (let i = 0; i < factors.length; i++) {
            const factor = factors[i];
            if (factor.type === NodeType.Neg) {
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

        const newFactors = factors.map((factor, index) => {
            return negIndices.includes(index) && factor.type === NodeType.Neg
                ? factor.arg
                : factor;
        }) as unknown as TwoOrMore<Semantic.types.NumericNode>;

        const newPrev = Semantic.builders.mul(newFactors);

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
export const moveNegToFirstFactor: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    const {checker} = context;

    if (prev.type === NodeType.Mul && prev.args[0].type !== NodeType.Neg) {
        const factors: TwoOrMore<Semantic.types.NumericNode> = [...prev.args];
        const index = factors.findIndex(
            (factor) => factor.type === NodeType.Neg,
        );

        // If there are no negatives then we can't transfer a negative
        if (index === -1) {
            return;
        }

        const newFactors = factors.map((f, i) => {
            if (i === 0) {
                return Semantic.builders.neg(f);
            } else if (i === index && f.type === NodeType.Neg) {
                return f.arg;
            } else {
                return f;
            }
        }) as unknown as TwoOrMore<Semantic.types.NumericNode>;

        const newPrev = Semantic.builders.mul(newFactors);
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

export const moveNegInsideMul: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    const {checker} = context;

    if (
        prev.type === NodeType.Neg &&
        !prev.subtraction &&
        prev.arg.type === NodeType.Mul
    ) {
        const mul = prev.arg;

        const newPrev = Semantic.builders.mul(
            [Semantic.builders.neg(mul.args[0]), ...mul.args.slice(1)],
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
    } else if (prev.type === NodeType.Add) {
        let changed = false;
        const newArgs = prev.args.map((arg) => {
            if (
                arg.type === NodeType.Neg &&
                !arg.subtraction &&
                arg.arg.type === NodeType.Mul
            ) {
                const mul = arg.arg;
                const newArg = Semantic.builders.mul(
                    [Semantic.builders.neg(mul.args[0]), ...mul.args.slice(1)],
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

        const newPrev = Semantic.builders.add(newArgs);

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
