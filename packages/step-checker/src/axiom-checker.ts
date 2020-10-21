import * as Semantic from "@math-blocks/semantic";

import {zip, applySubReasons} from "./util";
import {Context} from "./step-checker";
import {Result, Step} from "./types";

function addZero(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (prev.type !== "add") {
        return {
            equivalent: false,
            steps: [],
        };
    }

    return checkIdentity(
        prev,
        next,
        Semantic.addTerms,
        Semantic.number("0"), // TODO: provide a way to have different levels of messages, e.g.
        // "adding zero doesn't change an expression"
        "addition with identity",
        context,
    );
}

function mulOne(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (prev.type !== "mul") {
        return {
            equivalent: false,
            steps: [],
        };
    }

    return checkIdentity(
        prev,
        next,
        Semantic.mulFactors,
        Semantic.number("1"), // TODO: provide a way to have different levels of messages, e.g.
        // "multiplying by one doesn't change an expression"
        "multiplication with identity",
        context,
    );
}

function checkIdentity<T extends Semantic.Add | Semantic.Mul>(
    prev: T,
    next: Semantic.Expression,
    op: (arg0: Semantic.Expression[]) => Semantic.Expression,
    identity: Semantic.Num, // conditional types would come in handy here
    reason: string,
    context: Context,
): Result {
    const identityReasons: Step[] = [];
    const nonIdentityArgs = prev.args.filter((arg) => {
        const result = context.checker.checkStep(arg, identity, context);
        if (result.equivalent) {
            identityReasons.push(...result.steps);
        }
        return !result.equivalent;
    });

    // If we haven't removed any identities then this check has failed
    if (nonIdentityArgs.length === prev.args.length) {
        return {
            equivalent: false,
            steps: [],
        };
    }

    const newPrev = applySubReasons(prev, identityReasons);

    const newNext = op(nonIdentityArgs);
    const result = context.checker.checkStep(newNext, next, context);
    if (result.equivalent) {
        return {
            equivalent: true,
            steps: [
                ...identityReasons,
                {
                    message: reason,
                    nodes: [newPrev, newNext],
                },
                ...result.steps,
            ],
        };
    }

    return {
        equivalent: false,
        steps: [],
    };
}

function checkDistribution(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
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
                if (result.equivalent) {
                    results.push({
                        equivalent: true,
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
        return {
            equivalent: false,
            steps: [],
        };
    }
    if (prev.args[1].type === "add") {
        const newPrev = Semantic.add(
            prev.args[1].args.map((arg) =>
                Semantic.mul([prev.args[0], arg]),
            ) as TwoOrMore<Semantic.Expression>,
        );

        const result = context.checker.checkStep(newPrev, next, context);
        if (result.equivalent) {
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
        if (result.equivalent) {
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
    return {
        equivalent: false,
        steps: [],
    };
}

function checkFactoring(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    // TODO: update to match checkDistribution
    if (prev.type !== "add" || next.type !== "mul") {
        return {
            equivalent: false,
            steps: [],
        };
    }
    return distributionFactoring(prev, next, "factoring", context);
}

function distributionFactoring(
    addNode: Semantic.Add,
    mulNode: Semantic.Mul,
    reason: "distribution" | "factoring",
    context: Context,
): Result {
    // TODO: handle distribution across n-ary multiplication later
    if (mulNode.args.length === 2) {
        const [left, right] = mulNode.args;
        for (const [x, y] of [
            [left, right],
            [right, left],
        ]) {
            if (y.type === "add" && y.args.length === addNode.args.length) {
                const subReasons: Step[] = [];
                const equivalent = addNode.args.every((arg, index) => {
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

                    subReasons.push(...substep.steps);
                    return substep.equivalent;
                });

                if (equivalent) {
                    const nodes: Semantic.Expression[] =
                        reason === "distribution"
                            ? [mulNode, addNode]
                            : [addNode, mulNode];

                    // TODO: include the original nodes[0] in the result somehow
                    if (subReasons.length > 0) {
                        nodes[0] = applySubReasons(nodes[0], subReasons);
                    }

                    return {
                        equivalent: true,
                        steps:
                            reason === "distribution"
                                ? [
                                      {
                                          message: reason,
                                          nodes,
                                      },
                                      ...subReasons,
                                  ]
                                : [
                                      ...subReasons,
                                      {
                                          message: reason,
                                          nodes,
                                      },
                                  ],
                    };
                }
            }
        }
    }
    return {
        equivalent: false,
        steps: [],
    };
}

function mulByZero(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (prev.type !== "mul") {
        return {
            equivalent: false,
            steps: [],
        };
    }

    // TODO: ensure that steps from these calls to checkStep
    // are captured.
    const hasZero = prev.args.some(
        (arg) =>
            context.checker.checkStep(arg, Semantic.number("0"), context)
                .equivalent,
    );
    const result = context.checker.checkStep(
        next,
        Semantic.number("0"),
        context,
    );
    if (hasZero && result.equivalent) {
        return {
            equivalent: true,
            steps: [
                ...result.steps,
                {
                    message: "multiplication by zero",
                    nodes: [],
                },
            ],
        };
    }
    return {
        equivalent: false,
        steps: [],
    };
}

function commuteAddition(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (
        prev.type === "add" &&
        next.type === "add" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the args are the same disregarding order.
        const result = context.checker.checkArgs(prev, next, context);

        // If they aren't we can stop this check right here.
        if (!result.equivalent) {
            return {
                equivalent: false,
                steps: [],
            };
        }

        // If at least some of the pairs don't line up then it's safe to
        // say the args have been reordered.
        const reordered = pairs.some(([first, second]) => {
            // It's safe to ignore the reasons from this call to checkStep
            // since we're already getting the reasons why the nodes are equivalent
            // from the call to checkArgs
            const result = context.checker.checkStep(first, second, context);
            return !result.equivalent;
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

    return {
        equivalent: false,
        steps: [],
    };
}

function commuteMultiplication(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (
        prev.type === "mul" &&
        next.type === "mul" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        // Check if the arguments are the same disregarding order.
        const result = context.checker.checkArgs(prev, next, context);

        // If the args are the same then we can stop here.
        if (!result.equivalent) {
            return {
                equivalent: false,
                steps: [],
            };
        }

        const reordered = pairs.some(
            ([first, second]) =>
                // It's safe to ignore the steps from these checks
                // since we already have the steps from the checkArgs
                // call.
                !context.checker.checkStep(first, second, context).equivalent,
        );

        const newPrev = applySubReasons(prev, result.steps);

        if (reordered && result.equivalent) {
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

    return {
        equivalent: false,
        steps: [],
    };
}

function symmetricProperty(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    if (
        prev.type === "eq" &&
        next.type === "eq" &&
        prev.args.length === next.args.length
    ) {
        const pairs = zip(prev.args, next.args);

        const result = context.checker.checkArgs(prev, next, context);
        if (!result.equivalent) {
            return result;
        }

        const commutative = pairs.some(
            ([first, second]) =>
                !context.checker.checkStep(first, second, context).equivalent,
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

    return {
        equivalent: false,
        steps: [],
    };
}

export function runChecks(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    let result: Result;

    result = symmetricProperty(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = commuteAddition(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = commuteMultiplication(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = addZero(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = addZero(next, prev, context);
    if (result.equivalent) {
        return result;
    }

    result = mulOne(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = mulOne(next, prev, context);
    if (result.equivalent) {
        return result;
    }

    result = checkDistribution(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    result = checkFactoring(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    // a * 0 -> 0
    result = mulByZero(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    // 0 -> a * 0
    result = mulByZero(next, prev, context);
    if (result.equivalent) {
        return result;
    }

    return {
        equivalent: false,
        steps: [],
    };
}
