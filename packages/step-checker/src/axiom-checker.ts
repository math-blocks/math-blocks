import * as Semantic from "@math-blocks/semantic";

import {zip, applySubReasons} from "./util";
import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

class AxiomChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    addZero(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Semantic.addTerms,
            Semantic.number("0"), // TODO: provide a way to have different levels of messages, e.g.
            // "adding zero doesn't change an expression"
            "addition with identity",
            steps,
        );
    }

    mulOne(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Semantic.mulFactors,
            Semantic.number("1"), // TODO: provide a way to have different levels of messages, e.g.
            // "multiplying by one doesn't change an expression"
            "multiplication with identity",
            steps,
        );
    }

    checkIdentity<T extends Semantic.Add | Semantic.Mul>(
        prev: T,
        next: Semantic.Expression,
        op: (arg0: Semantic.Expression[]) => Semantic.Expression,
        identity: Semantic.Num, // conditional types would come in handy here
        reason: string,
        steps: Step[],
    ): Result {
        const identityReasons: Step[] = [];
        const nonIdentityArgs = prev.args.filter((arg) => {
            const result = this.checker.checkStep(arg, identity, steps);
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
        const result = this.checker.checkStep(newNext, next, steps);
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

    checkDistribution(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "mul" || next.type !== "add") {
            return {
                equivalent: false,
                steps: [],
            };
        }
        return this.distributionFactoring(next, prev, "distribution");
    }

    checkFactoring(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "add" || next.type !== "mul") {
            return {
                equivalent: false,
                steps: [],
            };
        }
        return this.distributionFactoring(prev, next, "factoring");
    }

    distributionFactoring(
        addNode: Semantic.Add,
        mulNode: Semantic.Mul,
        reason: "distribution" | "factoring",
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

                        // We reset the "reasons" parameter here because we checking
                        // different nodes so we won't run into a cycle here.
                        const substep = this.checker.checkStep(arg, term, []);

                        subReasons.push(...substep.steps);
                        return substep.equivalent;
                    });

                    if (equivalent) {
                        const nodes: Semantic.Expression[] =
                            reason === "distribution" ? [mulNode, addNode] : [addNode, mulNode];

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

    mulByZero(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        // TODO: ensure that steps from these calls to checkStep
        // are captured.
        const hasZero = prev.args.some(
            (arg) => this.checker.checkStep(arg, Semantic.number("0"), steps).equivalent,
        );
        const result = this.checker.checkStep(next, Semantic.number("0"), steps);
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

    commuteAddition(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        if (prev.type === "add" && next.type === "add" && prev.args.length === next.args.length) {
            const pairs = zip(prev.args, next.args);

            // Check if the args are the same disregarding order.
            const result = this.checker.checkArgs(prev, next, steps);

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
                const result = this.checker.checkStep(first, second, steps);
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

    commuteMultiplication(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        steps: Step[],
    ): Result {
        if (prev.type === "mul" && next.type === "mul" && prev.args.length === next.args.length) {
            const pairs = zip(prev.args, next.args);

            // Check if the arguments are the same disregarding order.
            const result = this.checker.checkArgs(prev, next, steps);

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
                    !this.checker.checkStep(first, second, steps).equivalent,
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

    symmetricProperty(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        if (prev.type === "eq" && next.type === "eq" && prev.args.length === next.args.length) {
            const pairs = zip(prev.args, next.args);

            const result = this.checker.checkArgs(prev, next, steps);
            if (!result.equivalent) {
                return result;
            }

            const commutative = pairs.some(
                ([first, second]) => !this.checker.checkStep(first, second, steps).equivalent,
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

    runChecks(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        let result: Result;

        result = this.symmetricProperty(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteAddition(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteMultiplication(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDistribution(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.checkFactoring(prev, next);
        if (result.equivalent) {
            return result;
        }

        // a * 0 -> 0
        result = this.mulByZero(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        // 0 -> a * 0
        result = this.mulByZero(next, prev, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default AxiomChecker;
