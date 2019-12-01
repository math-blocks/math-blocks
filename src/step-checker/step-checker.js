// @flow
import * as Semantic from "../semantic.js";

import {primeDecomp, zip} from "./util.js";

// StepChecker class
// methods:
// - checkStep
// - helper methods that use stepCheck: intersection, difference, etc.
//
// Other "checkers" can be created by passing an instance of a StepChecker as
// a param.
// What does the checkStep method do?
// How do we register different checkers? basic arithmetic, powers/exponent laws,
// trig, etc.

// A node is different if its children are different or if its type is different
// How to do a parallel traversal

// 1 = #/#

// There could be something like: (1 + 2) + (a + b) -> (2 + 1) + (b + a)
// How do we keep track of multiple changes to an expression tree
// What about something like: (1 + 2) + (a + b) -> (b + a) + (2 + 1) ?

// What if whenever we spot a difference, we check in our library of possible
// rules and if we match one of our rules then compare actually return true

// TODO: have a separate function that checks recursively
// TODO: provide a rational
const assertValid = (node: Semantic.Expression) => {
    switch (node.type) {
        case "mul":
        case "add": {
            if (node.args.length < 2) {
                throw new Error(
                    `${JSON.stringify(
                        node,
                    )} is not valid because it has less than two args`,
                );
            }
        }
    }
};

type Reason = {
    message: string,
    nodes: Semantic.Expression[],
};

type Result = {|
    equivalent: boolean,
    reasons: Reason[],
|};

// TODO: instead of defining this in code, we could have a JSON file that
// defines the properties of different operations, e.g.
// We can also use this file to generaate semantic.js
// TODO: figure out how to link to different properties as data, e.g.
// symmetric property (of equality), reflexive property (of equality), etc.
// Maybe that doesn't make sense becuase the properties are so closely tied
// to the operators.
/**
 * add: {
 *   can_commute: true,
 *   arg_count: [2, Math.infinity],
 *   identity_element: ZERO,
 *   inverse: neg,
 *   ...
 * }
 * neg: {
 *   arg_count: 1,
 *   ...
 * }
 */

type HasArgs =
    | Semantic.Add
    | Semantic.Mul
    | Semantic.Eq
    | Semantic.Neq
    | Semantic.Lt
    | Semantic.Lte
    | Semantic.Gt
    | Semantic.Gte
    | Semantic.Div
    | Semantic.Neg;

const hasArgs = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div" ||
    a.type === "neg";

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

const ZERO = {
    type: "number",
    value: "0",
};

const ONE = {
    type: "number",
    value: "1",
};

const num = (n: number): Semantic.Number => ({
    type: "number",
    value: String(n),
});

const div = (num: Semantic.Expression, den: Semantic.Expression) => ({
    type: "div",
    args: [num, den],
});

const isSubtraction = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && node.subtraction;

const isNegative = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && !node.subtraction;

const getFactors = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "mul" ? node.args : [node];

const getTerms = (node: Semantic.Expression): Semantic.Expression[] =>
    node.type === "add" ? node.args : [node];

const mul = (factors: Semantic.Expression[]): Semantic.Expression => {
    switch (factors.length) {
        case 0:
            return ONE;
        case 1:
            return factors[0];
        default:
            return {
                type: "mul",
                implicit: false,
                args: factors,
            };
    }
};

const add = (terms: Array<Semantic.Expression>): Semantic.Expression => {
    switch (terms.length) {
        case 0:
            return ZERO;
        case 1:
            return terms[0];
        default:
            return {
                type: "add",
                args: terms,
            };
    }
};

class StepChecker {
    /**
     * checkArgs will return true if each node has the same args even if the
     * order doesn't match.
     */
    checkArgs<T: HasArgs>(a: T, b: T): Result {
        const _reasons = [];
        const equivalent = a.args.every(ai =>
            b.args.some(bi => {
                const {equivalent, reasons} = this.checkStep(ai, bi);
                if (equivalent) {
                    _reasons.push(...reasons);
                }
                return equivalent;
            }),
        );
        return {
            equivalent,
            reasons: _reasons,
        };
    }

    /**
     * Returns all of the elements that appear in both as and bs.
     */
    intersection(as: Semantic.Expression[], bs: Semantic.Expression[]) {
        const result = [];
        for (const a of as) {
            const index = bs.findIndex(b => this.checkStep(a, b).equivalent);
            if (index !== -1) {
                result.push(a);
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            }
        }
        return result;
    }

    /**
     * Returns all of the elements that appear in as but not in bs.
     */
    difference(as: Semantic.Expression[], bs: Semantic.Expression[]) {
        const result = [];
        for (const a of as) {
            const index = bs.findIndex(b => this.checkStep(a, b).equivalent);
            if (index !== -1) {
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            } else {
                result.push(a);
            }
        }
        return result;
    }

    /**
     * Returns true if all every element in as is equivalent to an element in bs
     * and vice versa.
     */
    equality(as: Semantic.Expression[], bs: Semantic.Expression[]): boolean {
        return as.every(a => bs.some(b => this.checkStep(a, b).equivalent));
    }

    checkEquationStep(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== "eq" || b.type !== "eq") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;
        if (lhsB.type === rhsB.type) {
            if (lhsB.type === "add" && rhsB.type === "add") {
                const lhsNewTerms = this.difference(
                    getTerms(lhsB),
                    getTerms(lhsA),
                );
                const rhsNewTerms = this.difference(
                    getTerms(rhsB),
                    getTerms(rhsA),
                );
                const lhsNew = add(lhsNewTerms);
                const rhsNew = add(rhsNewTerms);
                const {equivalent, reasons} = this.checkStep(lhsNew, rhsNew);

                // TODO: handle adding multiple things to lhs and rhs as the same time
                // TODO: do we want to enforce that the thing being added is exactly
                // the same or do we want to allow equivalent expressions?
                if (equivalent && reasons.length === 0) {
                    if (
                        isSubtraction(lhsNewTerms[0]) &&
                        isSubtraction(rhsNewTerms[0])
                    ) {
                        return {
                            equivalent: true,
                            reasons: [
                                {
                                    message:
                                        "subtracting the same value from both sides",
                                    nodes: [],
                                },
                            ],
                        };
                    }
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message: "adding the same value to both sides",
                                nodes: [],
                            },
                        ],
                    };
                }
            }

            if (lhsB.type === "mul" && rhsB.type === "mul") {
                const lhsNewFactors = this.difference(
                    getFactors(lhsB),
                    getFactors(lhsA),
                );
                const rhsNewFactors = this.difference(
                    getFactors(rhsB),
                    getFactors(rhsA),
                );
                const {equivalent, reasons} = this.checkStep(
                    mul(lhsNewFactors),
                    mul(rhsNewFactors),
                );

                // TODO: do we want to enforce that the thing being added is exactly
                // the same or do we want to allow equivalent expressions?
                if (equivalent && reasons.length === 0) {
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message:
                                    "multiplying both sides by the same value",
                                nodes: [],
                            },
                        ],
                    };
                }
            }

            if (lhsB.type === "div" && rhsB.type === "div") {
                if (
                    this.checkStep(lhsA, lhsB.args[0]).equivalent &&
                    this.checkStep(rhsA, rhsB.args[0]).equivalent
                ) {
                    if (this.checkStep(lhsB.args[1], rhsB.args[1]).equivalent) {
                        return {
                            equivalent: true,
                            reasons: [
                                {
                                    message:
                                        "dividing both sides by the same value",
                                    nodes: [],
                                },
                            ],
                        };
                    } else {
                        // TODO: custom error message for this case
                    }
                }
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    addInverse(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const indicesToRemove = new Set();
        const terms = getTerms(prev);
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) {
                    continue;
                }
                const a = terms[i];
                const b = terms[j];
                // TODO: add a sub-step in the subtraction case
                if (isNegative(b) || isSubtraction(b)) {
                    const result = this.checkStep(a, b.args[0]);
                    if (result.equivalent) {
                        // TODO: capture the reasons and include them down below
                        indicesToRemove.add(i);
                        indicesToRemove.add(j);
                    }
                }
            }
        }
        if (indicesToRemove.size > 0) {
            const newPrev = add(
                terms.filter((term, index) => !indicesToRemove.has(index)),
            );
            const {equivalent, reasons} = this.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "adding inverse",
                            nodes: [],
                        },
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
    ): Result {
        if (isNegative(prev) && isNegative(prev.args[0])) {
            const newPrev = prev.args[0].args[0];
            const {equivalent, reasons} = this.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "negative of a negative is positive",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    subIsNeg(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (isSubtraction(prev) && isNegative(next)) {
            const {equivalent, reasons} = this.checkStep(
                prev.args[0],
                next.args[0],
            );
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message:
                                "subtracting is the same as adding the inverse",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    addZero(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            add,
            ZERO,
            // TODO: provide a way to have different levels of messages, e.g.
            // "adding zero doesn't change an expression"
            "addition with identity",
        );
    }

    mulOne(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            mul,
            ONE,
            // TODO: provide a way to have different levels of messages, e.g.
            // "multiplying by one doesn't change an expression"
            "multiplication with identity",
        );
    }

    checkIdentity<T: Semantic.Add | Semantic.Mul>(
        prev: T,
        next: Semantic.Expression,
        op: (Semantic.Expression[]) => Semantic.Expression,
        identity: Semantic.Number, // conditional types would come in handy here
        reason: string,
    ): Result {
        const identityReasons = [];
        const nonIdentityArgs = prev.args.filter(arg => {
            const {equivalent, reasons} = this.checkStep(arg, identity);
            if (equivalent) {
                identityReasons.push(...reasons);
            }
            return !equivalent;
        });

        // If we haven't removed any identities then this check has failed
        if (nonIdentityArgs.length === prev.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const newPrev = op(nonIdentityArgs);
        const {equivalent, reasons} = this.checkStep(newPrev, next);
        if (equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...identityReasons,
                    {
                        message: reason,
                        nodes: [],
                    },
                    ...reasons,
                ],
            };
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    checkDistribution(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (prev.type !== "mul" || next.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        return this.distFact(next, prev, "distribution");
    }

    checkFactoring(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        if (prev.type !== "add" || next.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        return this.distFact(prev, next, "factoring");
    }

    distFact(
        addNode: Semantic.Add,
        mulNode: Semantic.Mul,
        reason: "distribution" | "factoring",
    ): Result {
        // TODO: handle distribution across n-ary multiplication later
        if (mulNode.args.length === 2) {
            const [left, right] = mulNode.args;
            for (const [x, y] of [[left, right], [right, left]]) {
                if (y.type === "add" && y.args.length === addNode.args.length) {
                    // TODO: use exactMatch instead here... or we'll have track all
                    // of the reasons that are generated
                    const equivalent = addNode.args.every((arg, index) => {
                        return this.checkStep(arg, mul([x, y.args[index]]))
                            .equivalent;
                    });

                    if (equivalent) {
                        // TODO: include sub-reasons from checkStep
                        return {
                            equivalent: true,
                            reasons: [
                                {
                                    message: reason,
                                    nodes: [],
                                },
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

    decomposeFactors(factors: Semantic.Expression[]): Semantic.Expression[] {
        return factors.reduce((result: Semantic.Expression[], factor) => {
            // TODO: add decomposition of powers
            if (factor.type === "number") {
                return [
                    ...result,
                    ...primeDecomp(parseInt(factor.value)).map(num),
                ];
            } else {
                return [...result, factor];
            }
        }, []);
    }

    checkDivisionCanceling(
        a: Semantic.Expression,
        b: Semantic.Expression,
    ): Result {
        if (a.type !== "div") {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        const [numeratorA, denominatorA] = a.args;
        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsA = getFactors(numeratorA);
        const denFactorsA = getFactors(denominatorA);

        // cases:
        // - ab/ac -> a/a * b/c
        // - ab/a -> a/1 -> a
        const [numeratorB, denominatorB] = b.type === "div" ? b.args : [b, ONE];

        // Include ONE as a factor to handle cases where the denominator disappears
        // or the numerator chnages to 1.
        const numFactorsB = getFactors(numeratorB);
        const denFactorsB = getFactors(denominatorB);

        // Ensure that no extra factors were added to either the numerator
        // or denominator.  It's okay to ignore factors that ONE since multiplying
        // by 1 doesn't affect the value of the numerator or denominator.
        const addedNumFactors = this.difference(numFactorsB, numFactorsA);
        const addedDenFactors = this.difference(denFactorsB, denFactorsA);
        if (
            !this.checkStep(mul(addedNumFactors), ONE).equivalent ||
            !this.checkStep(mul(addedDenFactors), ONE).equivalent
        ) {
            // If the factors are different then it's possible that the user
            // decomposed one or more of the factors.  We decompose all factors
            // in both the current step `a` and the next step `b` and re-run
            // checkDivisionCanceling on the new fractions to see if that's the
            // case.
            const factoredNumFactorsA = this.decomposeFactors(numFactorsA);
            const factoredDenFactorsA = this.decomposeFactors(denFactorsA);
            const factoredNumFactorsB = this.decomposeFactors(numFactorsB);
            const factoredDenFactorsB = this.decomposeFactors(denFactorsB);

            if (
                factoredNumFactorsA.length !== numFactorsA.length ||
                factoredDenFactorsA.length !== denFactorsA.length
            ) {
                const newPrev = div(
                    mul(factoredNumFactorsA),
                    mul(factoredDenFactorsA),
                );
                const newNext = div(
                    mul(factoredNumFactorsB),
                    mul(factoredDenFactorsB),
                );

                // TODO: allow `nodes` in Reason type to have more than two nodes
                // to handle cases where we modify both prev and next to work the
                // problem from both sides essentially.
                const result1 = this.checkDivisionCanceling(newPrev, newNext);

                // Because we're also creating a new step coming from the opposite
                // direction, we need to check that that step will also work.
                const result2 = this.checkStep(newNext, b);

                if (result1.equivalent && result2.equivalent) {
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message: "prime factorization",
                                nodes: [],
                            },
                            ...result1.reasons,
                            ...result2.reasons,
                        ],
                    };
                }
            }

            // TODO: Add reason for why the canceling check failed
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: figure out how to handle duplicate factors
        const removedNumFactors = this.difference(numFactorsA, numFactorsB);
        const remainingNumFactors = this.intersection(numFactorsA, numFactorsB);
        const removedDenFactors = this.difference(denFactorsA, denFactorsB);
        const remainingDenFactors = this.intersection(denFactorsA, denFactorsB);

        if (remainingNumFactors.length === 0) {
            remainingNumFactors.push(ONE);
        }

        if (remainingDenFactors.length === 0) {
            remainingDenFactors.push(ONE);
        }

        // ab/ac -> a/a * b/c
        if (
            removedNumFactors.length > 0 &&
            removedNumFactors.length === removedDenFactors.length &&
            this.equality(removedNumFactors, removedDenFactors)
        ) {
            const productA = mul([
                div(mul(removedNumFactors), mul(removedDenFactors)),
                div(mul(remainingNumFactors), mul(remainingDenFactors)),
            ]);

            const {equivalent, reasons} = this.checkStep(productA, b);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message:
                                "extract common factors from numerator and denominator",
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

    divByFrac(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "div") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const [numerator, denominator] = prev.args;

        if (denominator.type === "div") {
            const reciprocal = div(denominator.args[1], denominator.args[0]);
            const newPrev = mul([numerator, reciprocal]); // ?
            const result = this.checkStep(newPrev, next);

            if (result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message:
                                "dividing by a fraction is the same as multiplying by the reciprocal",
                            nodes: [],
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

    divByOne(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (
            prev.type === "div" &&
            this.checkStep(prev.args[1], ONE).equivalent
        ) {
            const {equivalent, reasons} = this.checkStep(prev.args[0], next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "division by one",
                            nodes: [],
                        },
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    divBySame(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type === "div") {
            const [numerator, denominator] = prev.args;
            const result1 = this.checkStep(numerator, denominator);
            const result2 = this.checkStep(next, ONE);
            if (result1.equivalent && result2.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...result1.reasons,
                        {
                            message: "division by the same value",
                            nodes: [],
                        },
                        ...result2.reasons,
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    mulByFrac(prev: Semantic.Expression, next: Semantic.Expression): Result {
        // We need a multiplication node containing a fraction
        if (prev.type !== "mul" || prev.args.every(arg => arg.type !== "div")) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const numFactors = [];
        const denFactors = [];
        for (const arg of prev.args) {
            if (arg.type === "div") {
                const [numerator, denominator] = arg.args;
                numFactors.push(...getFactors(numerator));
                denFactors.push(...getFactors(denominator));
            } else {
                numFactors.push(...getFactors(arg));
            }
        }
        const newPrev = div(mul(numFactors), mul(denFactors));
        const {equivalent, reasons} = this.checkStep(newPrev, next);
        return {
            equivalent,
            reasons: equivalent
                ? [
                      {
                          message: "multiplying fractions",
                          nodes: [],
                      },
                      ...reasons,
                  ]
                : [],
        };
    }

    mulByZero(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: ensure that reasons from these calls to checkStep
        // are captured.
        const hasZero = prev.args.some(
            arg => this.checkStep(arg, ZERO).equivalent,
        );
        const {equivalent, reasons} = this.checkStep(next, ZERO);
        if (hasZero && equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...reasons,
                    {
                        message: "multiplication by zero",
                        nodes: [],
                    },
                ],
            };
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    commuteAddition(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (
            a.type === "add" &&
            b.type === "add" &&
            a.args.length === b.args.length
        ) {
            const pairs = zip(a.args, b.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(a, b);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "commutative property",
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

    evaluateMul(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== "mul" && b.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aFactors = getFactors(a);
        const bFactors = getFactors(b);

        const aNumTerms = aFactors.filter(term => term.type === "number");
        const bNumTerms = bFactors.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms);
        const aUniqFactors = this.difference(aNumTerms, commonTerms);
        const bUniqFactors = this.difference(bNumTerms, commonTerms);

        if (aUniqFactors.length > 0 && bUniqFactors.length > 0) {
            const aValue = aUniqFactors.reduce<number>(
                // $FlowFixMe
                (prod, arg) => prod * parseFloat(arg.value),
                1,
            );
            const bValue = bUniqFactors.reduce<number>(
                // $FlowFixMe
                (prod, arg) => prod * parseFloat(arg.value),
                1,
            );
            if (aValue === bValue) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "evaluation of multiplication",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    evaluateAdd(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== "add" && b.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aTerms = getTerms(a);
        const bTerms = getTerms(b);

        const aNumTerms = aTerms.filter(term => term.type === "number");
        const bNumTerms = bTerms.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms);
        const aUniqTerms = this.difference(aNumTerms, commonTerms);
        const bUniqTerms = this.difference(bNumTerms, commonTerms);

        if (aUniqTerms.length > 0 && bUniqTerms.length > 0) {
            const aValue = aUniqTerms.reduce<number>(
                // $FlowFixMe
                (sum, arg) => sum + parseFloat(arg.value),
                0,
            );
            const bValue = bUniqTerms.reduce<number>(
                // $FlowFixMe
                (sum, arg) => sum + parseFloat(arg.value),
                0,
            );
            if (aValue === bValue) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "evaluation of addition",
                            nodes: [],
                        },
                    ],
                };
            }
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }

    commuteMultiplication(
        a: Semantic.Expression,
        b: Semantic.Expression,
    ): Result {
        if (
            a.type === "mul" &&
            b.type === "mul" &&
            a.args.length === b.args.length
        ) {
            const pairs = zip(a.args, b.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(a, b);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "commutative property",
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

    symmetricProperty(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (
            a.type === "eq" &&
            b.type === "eq" &&
            a.args.length === b.args.length
        ) {
            const pairs = zip(a.args, b.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                pair => !this.checkStep(...pair).equivalent,
            );
            const {reasons, equivalent} = this.checkArgs(a, b);
            if (commutative && equivalent) {
                return {
                    equivalent,
                    reasons: [
                        {
                            message: "symmetric property",
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

    exactMatch(a: Semantic.Expression, b: Semantic.Expression): Result {
        if (a.type !== b.type) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        if (a.type === "neg" && b.type === "neg") {
            if (a.subtraction !== b.subtraction) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            return this.exactMatch(a.args[0], b.args[0]);
        } else if (hasArgs(a) && hasArgs(b)) {
            if (a.args.length !== b.args.length) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            if (a.type === "mul" && b.type === "mul") {
                // TODO: decide if we actually want to be this precise
                if (a.implicit !== b.implicit) {
                    return {
                        equivalent: false,
                        reasons: [],
                    };
                }
            }
            // $FlowFixMe: flow doesn't like passing tuples to functions expecting arrays
            const allMatch = zip(a.args, b.args).every(
                ([aArg, bArg]) => this.exactMatch(aArg, bArg).equivalent,
            );
            if (allMatch) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (a.type === "number" && b.type === "number") {
            if (a.value === b.value) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (a.type === "identifier" && b.type === "identifier") {
            if (a.name === b.name) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: check adding by inverse
    // TODO: dividing a fraction: a/b / c -> a / bc
    // TODO: add an identity check for all operations
    // TODO: check removal of parens, i.e. associative property
    // TODO: memoize checkStep to avoid re-doing the same work
    checkStep(a: Semantic.Expression, b: Semantic.Expression): Result {
        assertValid(a);
        assertValid(b);

        let result: Result;

        result = this.exactMatch(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.checkEquationStep(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateMul(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateAdd(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.symmetricProperty(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteAddition(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteMultiplication(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.doubleNegative(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.doubleNegative(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.divByFrac(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.divByOne(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.divBySame(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDivisionCanceling(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDivisionCanceling(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDistribution(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.checkFactoring(a, b);
        if (result.equivalent) {
            return result;
        }

        // a * b/c -> ab / c
        result = this.mulByFrac(a, b);
        if (result.equivalent) {
            return result;
        }

        // ab / c -> a * b/c
        result = this.mulByFrac(b, a);
        if (result.equivalent) {
            return result;
        }

        // a * 0 -> 0
        result = this.mulByZero(a, b);
        if (result.equivalent) {
            return result;
        }

        // 0 -> a * 0
        result = this.mulByZero(b, a);
        if (result.equivalent) {
            return result;
        }

        // General check if the args are equivalent for things with args
        // than are an array and not a tuple.
        if (a.type === b.type && hasArgs(a) && hasArgs(b)) {
            return this.checkArgs(a, b);
        }

        if (a.type === "number" && b.type === "number") {
            return {
                equivalent: a.value === b.value,
                reasons: [],
            };
        } else if (a.type === "identifier" && b.type === "identifier") {
            return {
                equivalent: a.name === b.name,
                reasons: [],
            };
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next);

export {checkStep};
