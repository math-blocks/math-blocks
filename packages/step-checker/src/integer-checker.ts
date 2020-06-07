import * as Semantic from "@math-blocks/semantic";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

class IntegerChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    addInverse(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (prev.type !== "add") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        const indicesToRemove = new Set();
        const terms = Semantic.getTerms(prev);

        // TODO: extract this code into a helper so that we can test it better
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) {
                    continue;
                }
                const a = terms[i];
                const b = terms[j];
                // TODO: add a sub-step in the subtraction case
                if (Semantic.isNegative(b) || Semantic.isSubtraction(b)) {
                    const result = checker.checkStep(a, b.arg, steps);
                    if (
                        result.equivalent &&
                        // Avoid removing a term that matches a term that's
                        // already been removed.
                        (!indicesToRemove.has(j) || !indicesToRemove.has(j))
                    ) {
                        // TODO: capture the reasons and include them down below
                        indicesToRemove.add(i);
                        indicesToRemove.add(j);
                    }
                }
            }
        }
        if (indicesToRemove.size > 0) {
            const newPrev = Semantic.addTerms(
                terms.filter(
                    (term: Semantic.Expression, index: number) =>
                        !indicesToRemove.has(index),
                ),
            );
            const result = reverse
                ? checker.checkStep(next, newPrev, steps)
                : checker.checkStep(newPrev, next, steps);

            if (result.equivalent) {
                return {
                    equivalent: true,
                    steps: reverse
                        ? [
                              ...result.steps,
                              {
                                  message: "adding inverse",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message: "adding inverse",
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

    doubleNegative(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        if (reverse) {
            [prev, next] = [next, prev];
        }
        const {checker} = this;
        if (Semantic.isNegative(prev) && Semantic.isNegative(prev.arg)) {
            const newPrev = prev.arg.arg;
            const result = reverse
                ? checker.checkStep(next, newPrev, steps)
                : checker.checkStep(newPrev, next, steps);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    steps: reverse
                        ? [
                              ...result.steps,
                              {
                                  message: "negative of a negative is positive",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message: "negative of a negative is positive",
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

    subIsNeg(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (
            prev.type === "add" &&
            next.type === "add" &&
            prev.args.length === next.args.length
        ) {
            const subs: Semantic.Neg[] = prev.args.filter(
                Semantic.isSubtraction,
            );
            for (const sub of subs) {
                const index = prev.args.indexOf(sub);
                // Either the corresponding arg in the next add node must be
                // negative or the sub node must contain a negative.
                // a - b -> a + -b or a - -b -> a + b
                if (
                    !Semantic.isNegative(next.args[index]) &&
                    !Semantic.isNegative(sub.arg)
                ) {
                    continue;
                }

                const newPrev = Semantic.addTerms([
                    ...prev.args.slice(0, index),
                    Semantic.neg(sub.arg),
                    ...prev.args.slice(index + 1),
                ]);

                const result = reverse
                    ? checker.checkStep(next, newPrev, steps)
                    : checker.checkStep(newPrev, next, steps);
                if (result.equivalent) {
                    return {
                        equivalent: true,
                        steps: reverse
                            ? [
                                  ...result.steps,
                                  {
                                      message:
                                          "subtracting is the same as adding the inverse",
                                      nodes: [newPrev, prev],
                                  },
                              ]
                            : [
                                  {
                                      message:
                                          "subtracting is the same as adding the inverse",
                                      nodes: [prev, newPrev],
                                  },
                                  ...result.steps,
                              ],
                    };
                }
            }
        }

        return {
            equivalent: false,
            steps: [],
        };
    }

    negIsMulOne(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (
            prev.type === "neg" && // exclude -1 to avoid an infinite expansion
            !(prev.arg.type == "number" && prev.arg.value == "1")
        ) {
            const newPrev = Semantic.mulFactors([
                Semantic.neg(Semantic.number("1")),
                ...Semantic.getFactors(prev.arg),
            ]);

            const result = reverse
                ? checker.checkStep(next, newPrev, steps)
                : checker.checkStep(newPrev, next, steps);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    steps: reverse
                        ? [
                              ...result.steps,
                              {
                                  message:
                                      "negation is the same as multipling by negative one",
                                  nodes: [newPrev, prev],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "negation is the same as multipling by negative one",
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

    mulTwoNegsIsPos(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        steps: Step[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (prev.type === "mul" && next.type === "mul") {
            // TODO: handle more factors
            if (prev.args.length === 2 && next.args.length === 2) {
                if (
                    prev.args[0].type === "neg" &&
                    prev.args[1].type === "neg"
                ) {
                    const newPrev = Semantic.mulFactors([
                        prev.args[0].arg,
                        prev.args[1].arg,
                    ]);

                    const result = reverse
                        ? checker.checkStep(next, newPrev, steps)
                        : checker.checkStep(newPrev, next, steps);
                    if (result.equivalent) {
                        return {
                            equivalent: true,
                            steps: reverse
                                ? [
                                      ...result.steps,
                                      {
                                          message:
                                              "multiplying two negatives is a positive",
                                          nodes: [],
                                      },
                                  ]
                                : [
                                      {
                                          message:
                                              "multiplying two negatives is a positive",
                                          nodes: [],
                                      },
                                      ...result.steps,
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

    // TODO: rename these methods to differentiate the StepChecker method from
    // this method
    runChecks(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        steps: Step[],
    ): Result {
        let result: Result;
        let result1: Result;
        let result2: Result;

        result = this.addInverse(prev, next, false, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(prev, next, true, steps);
        if (result.equivalent) {
            return result;
        }

        result1 = this.subIsNeg(prev, next, false, steps);
        result2 = this.subIsNeg(prev, next, true, steps);
        if (result1.equivalent && result2.equivalent) {
            if (result1.steps.length < result2.steps.length) {
                return result1;
            } else {
                return result2;
            }
        } else if (result1.equivalent) {
            return result1;
        } else if (result2.equivalent) {
            return result2;
        }

        result = this.mulTwoNegsIsPos(prev, next, false, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.mulTwoNegsIsPos(prev, next, true, steps);
        if (result.equivalent) {
            return result;
        }

        // Choose the fastest route when multiple paths exist.
        result1 = this.doubleNegative(prev, next, false, steps);
        result2 = this.doubleNegative(prev, next, true, steps);
        if (result1.equivalent && result2.equivalent) {
            if (result1.steps.length < result2.steps.length) {
                return result1;
            } else {
                return result2;
            }
        } else if (result1.equivalent) {
            return result1;
        } else if (result2.equivalent) {
            return result2;
        }

        // It's important that these methods are called after doubleNegative.  This
        // is because negatives can be interpreted as multiplying by -1 providing an
        // alternative path from --a -> a.
        // TODO: provide a way to show this more detailed version of --a -> a so that
        // students know why --a -> a is true.
        result = this.negIsMulOne(prev, next, false, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.negIsMulOne(prev, next, true, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default IntegerChecker;
