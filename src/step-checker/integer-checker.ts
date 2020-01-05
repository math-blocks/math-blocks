import * as Arithmetic from "./arithmetic";
import * as Semantic from "../semantic/semantic";

import {isNegative, isSubtraction} from "./arithmetic";

import {IStepChecker, Result, Reason} from "./step-checker";

class IntegerChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    addInverse(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        reasons: Reason[],
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
                    const result = checker.checkStep(a, b.arg, reasons);
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
                terms.filter(
                    (term: Semantic.Expression, index: number) =>
                        !indicesToRemove.has(index),
                ),
            );
            const result = reverse
                ? checker.checkStep(next, newPrev, reasons)
                : checker.checkStep(newPrev, next, reasons);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...result.reasons,
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
                              ...result.reasons,
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
        reverse: boolean,
        reasons: Reason[],
    ): Result {
        if (reverse) {
            [prev, next] = [next, prev];
        }
        const {checker} = this;
        if (isNegative(prev) && isNegative(prev.arg)) {
            const newPrev = prev.arg.arg;
            const result = reverse
                ? checker.checkStep(next, newPrev, reasons)
                : checker.checkStep(newPrev, next, reasons);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...result.reasons,
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
                              ...result.reasons,
                          ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    subIsNeg(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reverse: boolean,
        reasons: Reason[],
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
            const subs: Semantic.Neg[] = prev.args.filter(isSubtraction);
            for (const sub of subs) {
                const index = prev.args.indexOf(sub);
                // Either the corresponding arg in the next add node must be
                // negative or the sub node must contain a negative.
                // a - b -> a + -b or a - -b -> a + b
                if (!isNegative(next.args[index]) && !isNegative(sub.arg)) {
                    continue;
                }

                const newPrev = Arithmetic.add([
                    ...prev.args.slice(0, index),
                    Arithmetic.neg(sub.arg),
                    ...prev.args.slice(index + 1),
                ]);

                const result = reverse
                    ? checker.checkStep(next, newPrev, reasons)
                    : checker.checkStep(newPrev, next, reasons);
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
        reasons: Reason[],
    ): Result {
        const {checker} = this;
        if (reverse) {
            [prev, next] = [next, prev];
        }
        if (
            prev.type === "neg" && // exclude -1 to avoid an infinite expansion
            !(prev.arg.type == "number" && prev.arg.value == "1")
        ) {
            const newPrev = Arithmetic.mul([
                Arithmetic.neg(Arithmetic.num(1)),
                ...Arithmetic.getFactors(prev.arg),
            ]);

            const result = reverse
                ? checker.checkStep(next, newPrev, reasons)
                : checker.checkStep(newPrev, next, reasons);
            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: reverse
                        ? [
                              ...result.reasons,
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
                              ...result.reasons,
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
        reasons: Reason[],
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
                        prev.args[0].arg,
                        prev.args[1].arg,
                    ]);

                    const result = reverse
                        ? checker.checkStep(next, newPrev, reasons)
                        : checker.checkStep(newPrev, next, reasons);
                    if (result.equivalent) {
                        return {
                            equivalent: true,
                            reasons: reverse
                                ? [
                                      ...result.reasons,
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
                                      ...result.reasons,
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
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        let result: Result;
        let result1: Result;
        let result2: Result;

        result = this.addInverse(prev, next, false, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(prev, next, true, reasons);
        if (result.equivalent) {
            return result;
        }

        result1 = this.subIsNeg(prev, next, false, reasons);
        result2 = this.subIsNeg(prev, next, true, reasons);
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

        result = this.mulTwoNegsIsPos(prev, next, false, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.mulTwoNegsIsPos(prev, next, true, reasons);
        if (result.equivalent) {
            return result;
        }

        // Choose the fastest route when multiple paths exist.
        result1 = this.doubleNegative(prev, next, false, reasons);
        result2 = this.doubleNegative(prev, next, true, reasons);
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
        result = this.negIsMulOne(prev, next, false, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.negIsMulOne(prev, next, true, reasons);
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
