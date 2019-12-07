// @flow
import * as Arithmetic from "./arithmetic.js";
import * as Semantic from "../semantic.js";

import {isNegative, isSubtraction} from "./arithmetic.js";

import type {IStepChecker, Result} from "./step-checker.js";
import type {Expression} from "../semantic.js";

class IntegerChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    addInverse(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const indicesToRemove = new Set();
        const terms = Arithmetic.getTerms(prev);
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) {
                    continue;
                }
                const a = terms[i];
                const b = terms[j];
                // TODO: add a sub-step in the subtraction case
                if (isNegative(b) || isSubtraction(b)) {
                    const result = checker.checkStep(a, b.args[0]);
                    if (result.equivalent) {
                        // TODO: capture the reasons and include them down below
                        indicesToRemove.add(i);
                        indicesToRemove.add(j);
                    }
                }
            }
        }
        if (indicesToRemove.size > 0) {
            const newPrev = Arithmetic.add(
                terms.filter((term, index) => !indicesToRemove.has(index)),
            );
            const {equivalent, reasons} = checker.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...reasons,
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
                              ...reasons,
                          ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    doubleNegative(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse?: boolean,
    ): Result {
        if (reverse) {
            [prev, next] = [next, prev];
        }
        const {checker} = this;
        if (isNegative(prev) && isNegative(prev.args[0])) {
            const newPrev = prev.args[0].args[0];
            const {equivalent, reasons} = reverse
                ? checker.checkStep(next, newPrev)
                : checker.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...reasons,
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
                              ...reasons,
                          ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: return the "add" node so there's more context
    // This shouldn't be too hard because the position of the child shouldn't
    // change.
    subIsNeg(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (isSubtraction(prev)) {
            if (isNegative(next)) {
                // unwrap the subtraction
                prev = prev.args[0];
                // unwrap the negation
                next = next.args[0];
                const {equivalent, reasons} = reverse
                    ? checker.checkStep(next, prev)
                    : checker.checkStep(prev, next);
                if (equivalent) {
                    return {
                        equivalent: true,
                        reasons: reverse
                            ? [
                                  ...reasons,
                                  {
                                      message:
                                          "subtracting is the same as adding the inverse",
                                      nodes: [next, prev],
                                  },
                              ]
                            : [
                                  {
                                      message:
                                          "subtracting is the same as adding the inverse",
                                      nodes: [prev, next],
                                  },
                                  ...reasons,
                              ],
                    };
                }
            } else {
                // unwrap the subtraction
                prev = prev.args[0];
                const newPrev = Arithmetic.neg(prev);
                const result = reverse
                    ? checker.checkStep(next, newPrev)
                    : checker.checkStep(newPrev, next);

                if (result.equivalent) {
                    return {
                        equivalent: true,
                        reasons: reverse
                            ? [
                                  ...result.reasons,
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
                                  ...result.reasons,
                              ],
                    };
                }
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    negIsMulOne(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (
            prev.type === "neg" &&
            // exclude -1 to avoid an infinite expansion
            !(prev.args[0].type == "number" && prev.args[0].value == "1")
        ) {
            const newPrev = Arithmetic.mul([
                Arithmetic.neg(Arithmetic.num(1)),
                ...Arithmetic.getFactors(prev.args[0]),
            ]);

            const {equivalent, reasons} = checker.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...reasons,
                              {
                                  message:
                                      "negation is the same as multipling by negative one",
                                  nodes: [],
                              },
                          ]
                        : [
                              {
                                  message:
                                      "negation is the same as multipling by negative one",
                                  nodes: [],
                              },
                              ...reasons,
                          ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    mulTwoNegsIsPos(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
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
                    const newPrev = Arithmetic.mul([
                        prev.args[0].args[0],
                        prev.args[1].args[0],
                    ]);

                    const {equivalent, reasons} = checker.checkStep(
                        newPrev,
                        next,
                    );
                    if (equivalent) {
                        return {
                            equivalent: true,
                            reasons: reverse
                                ? [
                                      ...reasons,
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
                                      ...reasons,
                                  ],
                        };
                    }
                }
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: rename these methods to differentiate the StepChecker method from
    // this method
    checkStep(prev: Semantic.Expression, next: Semantic.Expression): Result {
        let result;

        result = this.addInverse(prev, next, false);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(prev, next, true);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(prev, next, false);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(prev, next, true);
        if (result.equivalent) {
            return result;
        }

        result = this.mulTwoNegsIsPos(prev, next, false);
        if (result.equivalent) {
            return result;
        }

        result = this.mulTwoNegsIsPos(prev, next, true);
        if (result.equivalent) {
            return result;
        }

        // Choose the fastest route when multiple paths exist.
        const result1 = this.doubleNegative(prev, next, false);
        const result2 = this.doubleNegative(prev, next, true);
        if (result1.equivalent && result2.equivalent) {
            if (result1.reasons.length < result2.reasons.length) {
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
        result = this.negIsMulOne(prev, next, false);
        if (result.equivalent) {
            return result;
        }

        result = this.negIsMulOne(prev, next, true);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default IntegerChecker;
