import * as Semantic from "@math-blocks/semantic";

import {zip, applySteps} from "./util";
import {Result, Step, Check, HasArgs} from "./types";
import {FAILED_CHECK} from "./constants";
import {checkArgs} from "./util";

const addZero: Check = (prev, next, context) => {
    return prev.type === "add"
        ? checkIdentity(prev, next, context)
        : FAILED_CHECK;
};

addZero.symmetric = true;

const mulOne: Check = (prev, next, context) => {
    return prev.type === "mul"
        ? checkIdentity(prev, next, context)
        : FAILED_CHECK;
};

mulOne.symmetric = true;

const checkIdentity: Check<Semantic.Add | Semantic.Mul> = (
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
        return FAILED_CHECK;
    }

    // Steps are local to the nodes involved which are descendents of prev so
    // in order to get a version of prev where all of the nodes that are equivalent
    // to the identiy have been replaced with the identity we need to call
    // applySteps which will do this for us.
    const newPrev = applySteps(prev, identitySteps);

    const newNext =
        prev.type === "add"
            ? Semantic.addTerms(nonIdentityArgs)
            : Semantic.mulFactors(nonIdentityArgs);

    // TODO: provide a way to have different levels of messages, e.g.
    // "multiplying by one doesn't change an expression.
    const reason =
        prev.type === "add"
            ? "addition with identity"
            : "multiplication with identity";

    const result = context.checker.checkStep(newNext, next, context);
    if (result) {
        return {
            equivalent: true,
            steps: [
                ...identitySteps,
                {
                    message: reason,
                    nodes: [newPrev, newNext],
                },
                ...result.steps,
            ],
        };
    }

    return FAILED_CHECK;
};

const checkDistribution: Check = (prev, next, context) => {
    // TODO: handle the case where a 'mul' within an 'add' was replaced
    if (prev.type === "add" && next.type === "add") {
        const results: Result[] = [];

        // TODO: find all 'mul' nodes and then try generating a newPrev
        // node from each of them.
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

                const result = context.checker.checkStep(
                    newPrev,
                    next,
                    context,
                );
                if (result) {
                    results.push({
                        steps: [
                            {
                                message: "distribution",
                                nodes: [prev, newPrev],
                            },
                            ...result.steps,
                        ],
                    });
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
        return FAILED_CHECK;
    }
    if (prev.args[1].type === "add") {
        const newPrev = Semantic.add(
            prev.args[1].args.map((arg) =>
                Semantic.mul([prev.args[0], arg]),
            ) as TwoOrMore<Semantic.Expression>,
        );

        const result = context.checker.checkStep(newPrev, next, context);
        if (result) {
            return {
                equivalent: true,
                steps: [
                    {
                        message: "distribution",
                        nodes: [prev, newPrev],
                    },
                    ...result.steps,
                ],
            };
        }
    }
    if (prev.args[0].type === "add") {
        const newPrev = Semantic.add(
            prev.args[0].args.map((arg) =>
                Semantic.mul([arg, prev.args[1]]),
            ) as TwoOrMore<Semantic.Expression>,
        );

        const result = context.checker.checkStep(newPrev, next, context);
        if (result) {
            return {
                equivalent: true,
                steps: [
                    {
                        message: "distribution",
                        nodes: [prev, newPrev],
                    },
                    ...result.steps,
                ],
            };
        }
    }
    return FAILED_CHECK;
};

// TODO: update this to follow what checkDistribution is doing more closely
const checkFactoring: Check = (prev, next, context) => {
    if (prev.type !== "add" || next.type !== "mul") {
        return FAILED_CHECK;
    }

    // TODO: handle distribution across n-ary multiplication later
    if (next.args.length === 2) {
        const [left, right] = next.args;
        for (const [x, y] of [
            [left, right],
            [right, left],
        ]) {
            if (y.type === "add" && y.args.length === prev.args.length) {
                const subReasons: Step[] = [];
                const equivalent = prev.args.every((arg, index) => {
                    // Each term is in the correct order based on whether
                    // we're distributing/factoring from left to right or
                    // the reverse
                    const term =
                        x === left
                            ? Semantic.mulFactors([x, y.args[index]])
                            : Semantic.mulFactors([y.args[index], x]);

                    // NOTE: We reset the "steps" parameter here because
                    // we're checking different nodes so we won't run into
                    // a cycle here.
                    const substep = context.checker.checkStep(arg, term, {
                        ...context,
                        steps: [],
                    });

                    if (substep) {
                        subReasons.push(...substep.steps);
                    }
                    return substep;
                });

                if (equivalent) {
                    const nodes: Semantic.Expression[] = [prev, next];

                    // TODO: include the original nodes[0] in the result somehow
                    if (subReasons.length > 0) {
                        nodes[0] = applySteps(nodes[0], subReasons);
                    }

                    return {
                        equivalent: true,
                        steps: [
                            ...subReasons,
                            {
                                message: "factoring",
                                nodes,
                            },
                        ],
                    };
                }
            }
        }
    }

    return FAILED_CHECK;
};

const mulByZero: Check = (prev, next, context) => {
    if (prev.type !== "mul") {
        return FAILED_CHECK;
    }

    // TODO: ensure that steps from these calls to checkStep
    // are captured.
    const hasZero = prev.args.some((arg) =>
        context.checker.checkStep(arg, Semantic.number("0"), context),
    );
    const result = context.checker.checkStep(
        next,
        Semantic.number("0"),
        context,
    );
    if (hasZero && result) {
        return {
            equivalent: true,
            steps: [
                ...result.steps,
                {
                    message: "multiplication by zero",
                    nodes: [], // TODO: add nodes
                },
            ],
        };
    }
    return FAILED_CHECK;
};

mulByZero.symmetric = true;

const commuteAddition: Check = (prev, next, context) => {
    if (
        prev.type === "add" &&
        next.type === "add" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the args are the same disregarding order.
        const result = checkArgs(prev, next, context);

        // If they aren't we can stop this check right here.
        if (!result) {
            return FAILED_CHECK;
        }

        // If at least some of the pairs don't line up then it's safe to
        // say the args have been reordered.
        const reordered = pairs.some(([first, second]) => {
            // It's safe to ignore the reasons from this call to checkStep
            // since we're already getting the reasons why the nodes are equivalent
            // from the call to checkArgs
            const result = context.checker.checkStep(first, second, context);
            return !result;
        });

        if (reordered) {
            return {
                equivalent: true,
                steps: [
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
                    ...result.steps,
                    {
                        message: "commutative property",
                        nodes: [],
                    },
                ],
            };
        }
    }

    return FAILED_CHECK;
};

const commuteMultiplication: Check = (prev, next, context) => {
    if (
        prev.type === "mul" &&
        next.type === "mul" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the arguments are the same disregarding order.
        const result = checkArgs(prev, next, context);

        // If the args are the same then we can stop here.
        if (!result) {
            return FAILED_CHECK;
        }

        const reordered = pairs.some(
            ([first, second]) =>
                // It's safe to ignore the steps from these checks
                // since we already have the steps from the checkArgs
                // call.
                !context.checker.checkStep(first, second, context),
        );

        const newPrev = applySteps(prev, result.steps);

        if (reordered && result) {
            return {
                equivalent: true,
                steps: [
                    ...result.steps,
                    {
                        message: "commutative property",
                        nodes: [newPrev, next],
                    },
                ],
            };
        }
    }

    return FAILED_CHECK;
};

const symmetricProperty: Check = (prev, next, context) => {
    if (
        prev.type === "eq" &&
        next.type === "eq" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        const result = checkArgs(prev, next, context);
        if (!result) {
            return result;
        }

        const commutative = pairs.some(
            ([first, second]) =>
                !context.checker.checkStep(first, second, context),
        );

        if (commutative) {
            return {
                equivalent: true,
                steps: [
                    {
                        message: "symmetric property",
                        nodes: [],
                    },
                    ...result.steps,
                ],
            };
        }
    }

    return FAILED_CHECK;
};

export const runChecks: Check = (prev, next, context) => {
    const checks = [
        symmetricProperty,
        commuteAddition,
        commuteMultiplication,
        addZero,
        mulOne,
        checkDistribution,
        checkFactoring,
        mulByZero,
    ];

    for (const check of checks) {
        const result = check(prev, next, context);
        if (result) {
            return result;
        }

        if (check.symmetric) {
            const result = check(next, prev, context);
            if (result) {
                return result;
            }
        }
    }

    return FAILED_CHECK;
};
