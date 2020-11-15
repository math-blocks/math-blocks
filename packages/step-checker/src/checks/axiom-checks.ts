import * as Semantic from "@math-blocks/semantic";

import {Result, Step, Check} from "../types";
import {Status, MistakeId} from "../enums";

import {exactMatch, checkArgs} from "./basic-checks";
import {zip, applySteps, correctResult, difference, intersection} from "./util";

export const addZero: Check = (prev, next, context) => {
    if (next.type !== "add") {
        return;
    }

    const {checker} = context;

    // Check that each new term is equivalent to zero
    const identity = Semantic.number("0");

    const identitySteps: Step[] = [];
    const nonIdentityArgs: Semantic.Expression[] = [];

    const newNextArgs = next.args.map((arg) => {
        // The order of the args passed to checkStep is important.  We want to
        // maintain the correct direction.
        const result = checker.checkStep(identity, arg, {
            ...context,
            // This has the effect of discarding any mistakes accumulated by
            // this call to checkStep.
            // 'identity' is synthetic which means if any mistakes are reported
            // invovling it, we won't be able to report those back to the user
            // it's not a node that appears in any of the expressions that the
            // user has entered themselves.
            mistakes: [],
        });
        if (result) {
            identitySteps.push(...result.steps);
            // We include all identities in the output so that we can handle
            // expressions with multiple identities, e.g. a + 0 + b + 0.
            // We create a new number("0") each time so that we can differentiate
            // each instance.
            return Semantic.number("0");
        } else {
            nonIdentityArgs.push(arg);
            return arg;
        }
    });

    // If we haven't removed any identities then this check has failed
    if (nonIdentityArgs.length === next.args.length) {
        const prevTerms = Semantic.getTerms(prev);
        const newNonIdentityTerms = difference(next.args, prevTerms);
        const oldTerms = intersection(prevTerms, next.args);

        if (
            newNonIdentityTerms.length > 0 &&
            // check that no terms were removed
            oldTerms.length === prevTerms.length
        ) {
            context.mistakes.push({
                id: MistakeId.EXPR_ADD_NON_IDENTITY,
                nodes: newNonIdentityTerms,
            });
        }
        return;
    }

    const newNext = Semantic.addTerms(newNextArgs);
    const newPrev = Semantic.addTerms(nonIdentityArgs);

    // This first check is fine since nonIdentityArgs only contains nodes from
    // an expression entered by a user.
    const result1 = context.checker.checkStep(prev, newPrev, context);
    // This second check is not fine since newNext contains 'identity'.
    // TODO: If a mistake is reported involving 'identity' then we'll need to
    // filter it out of the 'mistakes' array.  We should try to come up with a
    // scenario where this will matter.
    const result2 = context.checker.checkStep(newNext, next, {
        ...context,
        filters: {
            disallowedChecks: new Set(["addZero"]),
        },
    });

    if (result1 && result2) {
        // TODO: figure out how to incorporate steps from result2.
        // Do we need to apply afterSteps to newNext in correctResult?
        return correctResult(
            // If there are no steps from prev to newPrev, use prev since it
            // won't have any new nodes.  We can do this here because result1
            // comes from calling checkStep() on prev and newPrev.  This is
            // currently the only check that does this.
            result1.steps.length > 0 ? newPrev : prev,
            // Same for newNext and next
            result2.steps.length > 0 ? newNext : next,
            context.reversed,
            result1.steps,
            identitySteps,
            "addition with identity",
        );
    }

    return;
};
addZero.symmetric = true;

export const mulOne: Check = (prev, next, context) => {
    // This check prunes a lot of paths... we could try multiplying by "1" as
    // long as prev.
    // This is going in the direction of (a)(1) -> a
    // so if we have -a we can go from (-a)(1) -> a
    // TODO: figure out how we can drop this without running into recursion limits
    if (next.type !== "mul") {
        return;
    }

    const {checker} = context;

    const identity = Semantic.number("1");

    const identitySteps: Step[] = [];
    const nonIdentityArgs: Semantic.Expression[] = [];

    const newNextArgs = next.args.map((arg) => {
        // The order of the args passed to checkStep is important.  We want to
        // maintain the correct direction.
        const result = checker.checkStep(identity, arg, {
            ...context,
            // This has the effect of discarding any mistakes accumulated by
            // this call to checkStep.
            // 'identity' is synthetic which means if any mistakes are reported
            // invovling it, we won't be able to report those back to the user
            // it's not a node that appears in any of the expressions that the
            // user has entered themselves.
            mistakes: [],
        });
        if (result) {
            identitySteps.push(...result.steps);
            // We include all identities in the output so that we can handle
            // expressions with multiple identities, e.g. a * 1 * b * 1
            // We create a new number("1") each time so that we can differentiate
            // each instance.
            return Semantic.number("1");
        } else {
            nonIdentityArgs.push(arg);
            return arg;
        }
    });

    // If we haven't removed any identities then this check has failed
    if (nonIdentityArgs.length === next.args.length) {
        const prevFactors = Semantic.getFactors(prev);
        const newNonIdentityFactors = difference(next.args, prevFactors);
        const oldFactors = intersection(prevFactors, next.args);
        if (
            newNonIdentityFactors.length > 0 &&
            // check that no factors were removed
            oldFactors.length === prevFactors.length
        ) {
            context.mistakes.push({
                id: MistakeId.EXPR_MUL_NON_IDENTITY,
                nodes: newNonIdentityFactors,
            });
        }
        return;
    }

    const newNext = Semantic.mulFactors(newNextArgs);

    // TODO: provide a way to have different levels of messages, e.g.
    // "multiplying by one doesn't change an expression.
    const reason = "multiplication with identity";

    const newPrev = Semantic.mulFactors(nonIdentityArgs);

    // This first check is fine since nonIdentityArgs only contains nodes from
    // an expression entered by a user.
    const result1 = context.checker.checkStep(prev, newPrev, context);
    // This second check is not fine since newNext contains 'identity'.
    // TODO: If a mistake is reported involving 'identity' then we'll need to
    // filter it out of the 'mistakes' array.  We should try to come up with a
    // scenario where this will matter.
    // TODO: instead of trying to filter mistakes out at each point, we can
    // wait until the end and cross check the ids against those in the original
    // expressions.
    const result2 = context.checker.checkStep(newNext, next, {
        ...context,
        filters: {
            disallowedChecks: new Set(["mulOne"]),
        },
    });

    if (result1 && result2) {
        // TODO: figure out how to incorporate steps from result2.
        // Do we need to apply afterSteps to newNext in correctResult?
        return correctResult(
            // If there are no steps from prev to newPrev, use prev since it
            // won't have any new nodes.  We can do this here because result1
            // comes from calling checkStep() on prev and newPrev.  This is
            // currently the only check that does this.
            result1.steps.length > 0 ? newPrev : prev,
            // Same for newNext and next
            result2.steps.length > 0 ? newNext : next,
            context.reversed,
            result1.steps,
            identitySteps,
            reason,
        );
    }

    return;
};
mulOne.symmetric = true;

export const checkDistribution: Check = (prev, next, context) => {
    // Handle the situation where we have a term within an 'add' node that needs
    // distributing.
    if (prev.type === "add" && next.type === "add") {
        const results: Result[] = [];

        // Only allow the following checks in subsequent calls to checkStep.
        const filters = {
            allowedChecks: new Set([
                // NOTE: If more checks use filters then we may have to
                // uncomment this line.
                // ...(context?.filters?.allowedChecks || []),
                "checkDistribution",
                "negIsMulNegOne",
                "subIsNeg",
                "mulTwoNegsIsPos",
                "moveNegInsideMul",
                "moveNegToFirstFactor",
            ]),
            disallowedChecks: context.filters?.disallowedChecks,
        };

        // Find all 'mul' nodes and then try generating a newPrev node from
        // each of them.
        for (let i = 0; i < prev.args.length; i++) {
            const mul = prev.args[i];

            if (
                mul.type === "mul" &&
                mul.args.length === 2 &&
                mul.args[1].type === "add"
            ) {
                const newPrev = Semantic.addTerms([
                    ...prev.args.slice(0, i),
                    ...(mul.args[1].args.map((arg) =>
                        Semantic.mul([mul.args[0], arg], mul.implicit),
                    ) as TwoOrMore<Semantic.Expression>),
                    ...prev.args.slice(i + 1),
                ]);

                const result = context.checker.checkStep(newPrev, next, {
                    ...context,
                    filters,
                });
                if (result) {
                    results.push(
                        correctResult(
                            prev,
                            newPrev,
                            context.reversed,
                            [],
                            result.steps,
                            "distribution",
                            "factoring",
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
    }

    if (prev.type !== "mul" || next.type !== "add") {
        return;
    }

    // If the second factor is an add, e.g. a(b + c) -> ...
    if (prev.args[1].type === "add") {
        const newPrev = Semantic.add(
            prev.args[1].args.map((arg) => {
                if (arg.type === "neg") {
                    // Set 'subtraction' prop to false
                    return Semantic.mul([prev.args[0], Semantic.neg(arg.arg)]);
                } else {
                    return Semantic.mul([prev.args[0], arg], prev.implicit);
                }
            }) as TwoOrMore<Semantic.Expression>,
        );

        const result = context.checker.checkStep(newPrev, next, context);
        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "distribution",
                "factoring",
            );
        }
    }

    // If the first factor is an add, e.g. (b + c)a -> ...
    if (prev.args[0].type === "add") {
        const newPrev = Semantic.add(
            prev.args[0].args.map((arg) =>
                Semantic.mul([arg, prev.args[1]]),
            ) as TwoOrMore<Semantic.Expression>,
        );

        const result = context.checker.checkStep(newPrev, next, context);
        if (result) {
            return correctResult(
                prev,
                newPrev,
                context.reversed,
                [],
                result.steps,
                "distribution",
                "factoring",
            );
        }
    }
};

checkDistribution.symmetric = true;

export const mulByZero: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type !== "mul") {
        return;
    }

    const identitySteps: Step[] = [];

    // It's sufficient to find only one zero since mutliplying one zero is
    // enough to turn the whole product to zero.
    const hasZero = prev.args.some((arg) => {
        const result = checker.checkStep(arg, Semantic.number("0"), context);
        if (result) {
            identitySteps.push(...result.steps);
            return result;
        }
    });
    const newPrev = Semantic.number("0");
    const result = checker.checkStep(newPrev, next, context);

    if (hasZero && result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            identitySteps,
            result.steps,
            "multiplication by zero",
        );
    }
};

mulByZero.symmetric = true;

export const commuteAddition: Check = (prev, next, context) => {
    const {checker} = context;

    if (
        prev.type === "add" &&
        next.type === "add" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the args are the same disregarding order.
        const result1 = checkArgs(prev, next, context);

        // If they aren't we can stop this check right here.
        if (!result1) {
            return;
        }

        const steps: Step[] = [];

        // If at least some of the pairs don't line up then it's safe to
        // say the args have been reordered.
        const reordered = pairs.some(([first, second]) => {
            // It's safe to ignore the reasons from this call to checkStep
            // since we're already getting the reasons why the nodes are equivalent
            // from the call to checkArgs
            const result = checker.checkStep(first, second, context);
            if (result) {
                steps.push(...result.steps);
            }
            return !result;
        });

        const newPrev = applySteps(prev, result1.steps);

        if (reordered && result1) {
            // No need to run checkStep(newPrev, next) since we already know
            // they're equivalent because of checkArgs.  The only difference
            // is the order of the args which is what we're communicate with
            // the "commutative property" message in the result.

            // We'd like any of the reasons from the checkArgs call to appear
            // first since it'll be easier to see that commutative property is
            // be applied once all of the values are the same.
            //
            // What about when we're going in reverse and splitting numbers up?
            // That seems like a very unlikely situation.
            //
            // The order doesn't really matter.  We could provide a way to indicate
            // the precedence between different operations and use that to decide
            // the ordering.
            return correctResult(
                newPrev,
                next,
                context.reversed,
                result1.steps,
                [],
                "commutative property",
            );
        }
    }
};

export const commuteMultiplication: Check = (prev, next, context) => {
    const {checker} = context;

    if (
        prev.type === "mul" &&
        next.type === "mul" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the arguments are the same disregarding order.
        const result1 = checkArgs(prev, next, context);

        // If the args are the same then we can stop here.
        if (!result1) {
            return;
        }

        const reordered = pairs.some(
            ([first, second]) =>
                // It's safe to ignore the steps from these checks
                // since we already have the steps from the checkArgs
                // call.
                !checker.checkStep(first, second, context),
        );

        const newPrev = applySteps(prev, result1.steps);

        if (reordered && result1) {
            // No need to run checkStep(newPrev, next) since we already know
            // they're equivalent because of checkArgs.  The only difference
            // is the order of the args which is what we're communicate with
            // the "commutative property" message in the result.

            return correctResult(
                newPrev,
                next,
                context.reversed,
                result1.steps,
                [],
                "commutative property",
            );
        }
    }
};

// TODO: check that context.reversed is being handled correctly
export const symmetricProperty: Check = (prev, next, context) => {
    // We prefer that 'symmetric property' always appear last in the list of
    // steps.  This is because it's common to do a bunch of steps to an equation
    // and then swap sides at the last moment so that the variable that we're
    // looking to isolate is on the left.
    if (!context.reversed) {
        return;
    }

    if (
        prev.type === "eq" &&
        next.type === "eq" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // If there are only two args, we swap them and then check that it
        // exactly matches the next step.
        if (pairs.length === 2) {
            const newPrev = Semantic.eq([prev.args[1], prev.args[0]]);
            const result = exactMatch(newPrev, next, context);

            if (result) {
                return {
                    status: Status.Correct,
                    steps: [
                        ...result.steps,
                        {
                            message: "symmetric property",
                            nodes: [newPrev, prev],
                        },
                    ],
                };
            }
        }

        // If at least one of the pairs doesn't match then we've swapped the
        // pairs around.  The issue with using checkStep here is that we could
        // end up making changes to items that are equivalent, e.g.
        // x + 0 = x -> x = x + 0 in which case we wouldn't identify this as
        // the symmetric property of equality.
        const commutative = pairs.some(
            ([first, second]) =>
                !context.checker.checkStep(first, second, context),
        );

        if (commutative) {
            const result = checkArgs(prev, next, context);

            if (result) {
                const newNext = applySteps(next, result.steps);
                return {
                    status: Status.Correct,
                    steps: [
                        ...result.steps,
                        {
                            message: "symmetric property",
                            nodes: [newNext, prev],
                        },
                    ],
                };
            }
        }
    }
};

symmetricProperty.symmetric = true;
