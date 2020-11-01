import * as Semantic from "@math-blocks/semantic";

import {zip, applySteps, correctResult} from "./util";
import {Result, Step, Check, Status} from "../types";

import {exactMatch, checkArgs} from "./basic-checks";

export const addZero: Check = (prev, next, context) => {
    return prev.type === "add" ? checkIdentity(prev, next, context) : undefined;
};

addZero.symmetric = true;

export const mulOne: Check = (prev, next, context) => {
    return prev.type === "mul" ? checkIdentity(prev, next, context) : undefined;
};

mulOne.symmetric = true;

export const checkIdentity: Check<Semantic.Add | Semantic.Mul> = (
    prev,
    next,
    context,
) => {
    const identity =
        prev.type === "add" ? Semantic.number("0") : Semantic.number("1");

    const identitySteps: Step[] = [];
    const nonIdentityArgs: Semantic.Expression[] = [];
    for (const arg of prev.args) {
        const result = context.checker.checkStep(arg, identity, context);
        if (result) {
            identitySteps.push(...result.steps);
        } else {
            nonIdentityArgs.push(arg);
        }
    }

    // If we haven't removed any identities then this check has failed
    if (nonIdentityArgs.length === prev.args.length) {
        return;
    }

    // Steps are local to the nodes involved which are descendents of prev so
    // in order to get a version of prev where all of the nodes that are equivalent
    // to the identiy have been replaced with the identity we need to call
    // applySteps which will do this for us.

    // TODO: make this check symmetric - we should be able to get rid of newNext
    const newPrev =
        prev.type === "add"
            ? Semantic.addTerms(nonIdentityArgs)
            : Semantic.mulFactors(nonIdentityArgs);

    // TODO: provide a way to have different levels of messages, e.g.
    // "multiplying by one doesn't change an expression.
    const reason =
        prev.type === "add"
            ? "addition with identity"
            : "multiplication with identity";

    const result = context.checker.checkStep(newPrev, next, context);
    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            identitySteps,
            result.steps,
            reason,
        );
    }

    return;
};

checkIdentity.symmetric = true;

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
                        Semantic.mul([mul.args[0], arg]),
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
            } else if (
                mul.type === "neg" &&
                mul.subtraction &&
                mul.arg.type === "add"
            ) {
                const newPrev = Semantic.addTerms([
                    ...prev.args.slice(0, i),
                    Semantic.mul([Semantic.neg(Semantic.number("1")), mul.arg]),
                    ...prev.args.slice(i + 1),
                ]);
                const result = context.checker.checkStep(newPrev, next, {
                    ...context,
                    filters,
                });
                if (result) {
                    return correctResult(
                        prev,
                        newPrev,
                        context.reversed,
                        [],
                        result.steps,
                        "subtraction is the same as multiplying by negative one",
                    );
                    // results.push({
                    //     status: Status.Correct,
                    //     steps: [
                    //         {
                    //             message:
                    //                 "subtraction is the same as multiplying by negative one",
                    //             nodes: [prev, newPrev],
                    //         },
                    //         ...result.steps,
                    //     ],
                    // });
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
                    return Semantic.mul([prev.args[0], arg]);
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
    if (prev.type !== "mul") {
        return;
    }

    // TODO: ensure that steps from these calls to checkStep
    // are captured.
    const hasZero = prev.args.some((arg) =>
        context.checker.checkStep(arg, Semantic.number("0"), context),
    );
    const newPrev = Semantic.number("0");
    const result = context.checker.checkStep(newPrev, next, context);

    if (hasZero && result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
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
