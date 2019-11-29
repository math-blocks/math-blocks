// @flow
import * as Semantic from "../semantic.js";

import {primeDecomp} from "./util.js";

// A node is different if its children are different or if its type is different
// How to do a parallel traversal

// 1 = #/#

const zip = <A, B>(a: A[], b: B[]): [A, B][] => {
    const result = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        result.push([a[i], b[i]]);
    }
    return result;
};

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

// TODO: make Reasons more structural in the future
// type Reason = {
//     type: "commuative" | "associative" | "distributive",
//     nodes: Semantic.Expression[],
// };
type Reason = string;

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

const add = (args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (implicit: boolean) => (
    args: Semantic.Expression[],
): Semantic.Mul => ({
    type: "mul",
    implicit,
    args,
});

const implicitMul = mul(true);
const explicitMul = mul(false);

const div = (num: Semantic.Expression, den: Semantic.Expression) => ({
    type: "div",
    args: [num, den],
});

type Result = {|
    equivalent: boolean,
    reasons: Reason[],
|};

const isSubtraction = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && node.subtraction;

const getFactors = (node: Semantic.Expression): Array<Semantic.Expression> =>
    node.type === "mul" ? node.args : [node];

const getTerms = (node: Semantic.Expression): Array<Semantic.Expression> =>
    node.type === "add" ? node.args : [node];

// filters out ONEs and will return either a Mul node or a single Expression node
const mulFactors = (
    factors: Array<Semantic.Expression>,
): Semantic.Expression => {
    switch (factors.length) {
        case 0:
            return ONE;
        case 1:
            return factors[0];
        default:
            return explicitMul(factors);
    }
};

const addTerms = (terms: Array<Semantic.Expression>): Semantic.Expression => {
    switch (terms.length) {
        case 0:
            return ONE;
        case 1:
            return terms[0];
        default:
            return add(terms);
    }
};

const ops: {
    add: {
        identity: Semantic.Number,
        op: (Semantic.Expression[]) => Semantic.Expression,
        reason: string,
    },
    mul: {
        identity: Semantic.Number,
        op: (Semantic.Expression[]) => Semantic.Expression,
        reason: string,
    },
} = {
    add: {
        identity: ZERO,
        op: addTerms,
        // TODO: have a variety of different ways of stating this
        // e.g., "addition with zero"
        reason: "addition with identity",
    },
    mul: {
        identity: ONE,
        op: mulFactors,
        // TODO: have a variety of different ways of stating this
        // e.g., "multiplication by one"
        reason: "multiplication with identity",
    },
};

/**
 * checkArgs will return true if each node has the same args even if the
 * order doesn't match.
 */
const checkArgs = <T: HasArgs>(a: T, b: T): Result => {
    const _reasons = [];
    const equivalent = a.args.every(ai =>
        b.args.some(bi => {
            const {equivalent, reasons} = checkStep(ai, bi);
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
};

/**
 * Returns all of the elements that appear in both as and bs.
 */
// TODO: fix this handle multipel equivalent expressions
const intersection = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.filter(a => bs.some(b => checkStep(a, b).equivalent));

/**
 * Returns all of the elements that appear in as but not in bs.
 */
// TODO: fix this handle multipel equivalent expressions
const difference = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.filter(a => !bs.some(b => checkStep(a, b).equivalent));

/**
 * Returns true if all every element in as is equivalent to an element in bs
 * and vice versa.
 */
const equality = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.every(a => bs.some(b => checkStep(a, b).equivalent));

const checkEquationStep = (
    a: Semantic.Expression,
    b: Semantic.Expression,
): Result => {
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
            const lhsNewTerms = difference(getTerms(lhsB), getTerms(lhsA));
            const rhsNewTerms = difference(getTerms(rhsB), getTerms(rhsA));
            const {equivalent, reasons} = checkStep(
                addTerms(lhsNewTerms),
                addTerms(rhsNewTerms),
            );

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
                        reasons: ["subtracting the same value from both sides"],
                    };
                }
                return {
                    equivalent: true,
                    reasons: ["adding the same value to both sides"],
                };
            }
        }

        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsNewFactors = difference(
                getFactors(lhsB),
                getFactors(lhsA),
            );
            const rhsNewFactors = difference(
                getFactors(rhsB),
                getFactors(rhsA),
            );
            const {equivalent, reasons} = checkStep(
                mulFactors(lhsNewFactors),
                mulFactors(rhsNewFactors),
            );

            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (equivalent && reasons.length === 0) {
                return {
                    equivalent: true,
                    reasons: ["multiplying both sides by the same value"],
                };
            }
        }

        if (lhsB.type === "div" && rhsB.type === "div") {
            if (
                checkStep(lhsA, lhsB.args[0]).equivalent &&
                checkStep(rhsA, rhsB.args[0]).equivalent
            ) {
                if (checkStep(lhsB.args[1], rhsB.args[1]).equivalent) {
                    return {
                        equivalent: true,
                        reasons: ["dividing both sides by the same value"],
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
};

const addZero = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type !== "add") {
        return {
            equivalent: false,
            reasons: [],
        };
    }

    const {identity, reason} = ops.add;
    return checkIdentity(prev, next, identity, reason);
};

const mulOne = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type !== "mul") {
        return {
            equivalent: false,
            reasons: [],
        };
    }

    const {identity, reason} = ops.mul;
    return checkIdentity(prev, next, identity, reason);
};

const checkIdentity = <T: Semantic.Add | Semantic.Mul>(
    prev: T,
    next: Semantic.Expression,
    identity: Semantic.Number, // conditional types would come in handy here
    reason: string,
) => {
    const identityReasons = [];
    const nonIdentityArgs = prev.args.filter(arg => {
        const {equivalent, reasons} = checkStep(arg, identity);
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

    const newPrev = ops[prev.type].op(nonIdentityArgs);
    const {equivalent, reasons} = checkStep(newPrev, next);
    if (equivalent) {
        return {
            equivalent: true,
            reasons: [...identityReasons, reason, ...reasons],
        };
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const checkDistribution = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type !== "mul" || next.type !== "add") {
        return {
            equivalent: false,
            reasons: [],
        };
    }
    return distFact(next, prev, "distribution");
};

const checkFactoring = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type !== "add" || next.type !== "mul") {
        return {
            equivalent: false,
            reasons: [],
        };
    }
    return distFact(prev, next, "factoring");
};

const distFact = (
    addNode: Semantic.Add,
    mulNode: Semantic.Mul,
    reason: "distribution" | "factoring",
) => {
    // TODO: handle distribution across n-ary multiplication later
    if (mulNode.args.length === 2) {
        const [left, right] = mulNode.args;
        for (const [x, y] of [[left, right], [right, left]]) {
            if (y.type === "add" && y.args.length === addNode.args.length) {
                const equivalent = addNode.args.every((arg, index) => {
                    return checkStep(arg, mulFactors([x, y.args[index]]))
                        .equivalent;
                });

                if (equivalent) {
                    // TODO: include sub-reasons from checkStep
                    return {
                        equivalent: true,
                        reasons: [reason],
                    };
                }
            }
        }
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const num = (n: number): Semantic.Number => ({
    type: "number",
    value: String(n),
});

const decomposeFactors = (
    factors: Semantic.Expression[],
): Semantic.Expression[] =>
    factors.reduce((result: Semantic.Expression[], factor) => {
        // TODO: add decomposition of powers
        if (factor.type === "number") {
            return [...result, ...primeDecomp(parseInt(factor.value)).map(num)];
        } else {
            return [...result, factor];
        }
    }, []);

const checkDivisionCanceling = (
    a: Semantic.Div,
    b: Semantic.Expression,
): Result => {
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
    const addedNumFactors = difference(numFactorsB, numFactorsA);
    const addedDenFactors = difference(denFactorsB, denFactorsA);
    if (
        !checkStep(mulFactors(addedNumFactors), ONE).equivalent ||
        !checkStep(mulFactors(addedDenFactors), ONE).equivalent
    ) {
        // If the factors are different then it's possible that the user
        // decomposed one or more of the factors.  We decompose all factors
        // in both the current step `a` and the next step `b` and re-run
        // checkDivisionCanceling on the new fractions to see if that's the
        // case.
        const factoredNumFactorsA = decomposeFactors(numFactorsA);
        const factoredDenFactorsA = decomposeFactors(denFactorsA);
        const factoredNumFactorsB = decomposeFactors(numFactorsB);
        const factoredDenFactorsB = decomposeFactors(denFactorsB);

        if (
            factoredNumFactorsA.length !== numFactorsA.length ||
            factoredDenFactorsA.length !== denFactorsA.length
        ) {
            const {equivalent, reasons} = checkDivisionCanceling(
                div(
                    mulFactors(factoredNumFactorsA),
                    mulFactors(factoredDenFactorsA),
                ),
                div(
                    mulFactors(factoredNumFactorsB),
                    mulFactors(factoredDenFactorsB),
                ),
            );

            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: ["prime factorization", ...reasons],
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
    const removedNumFactors = difference(numFactorsA, numFactorsB);
    const remainingNumFactors = intersection(numFactorsA, numFactorsB);
    const removedDenFactors = difference(denFactorsA, denFactorsB);
    const remainingDenFactors = intersection(denFactorsA, denFactorsB);

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
        equality(removedNumFactors, removedDenFactors)
    ) {
        const productA = explicitMul([
            div(mulFactors(removedNumFactors), mulFactors(removedDenFactors)),
            div(
                mulFactors(remainingNumFactors),
                mulFactors(remainingDenFactors),
            ),
        ]);
        const productB = explicitMul([ONE, b]);

        const {equivalent, reasons} = checkStep(productA, b);
        if (equivalent) {
            return {
                equivalent: true,
                reasons: ["canceling factors in division", ...reasons],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const divByFrac = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type !== "div") {
        return {
            equivalent: false,
            reasons: [],
        };
    }

    const [numerator, denominator] = prev.args;

    if (denominator.type === "div") {
        const reciprocal = div(denominator.args[1], denominator.args[0]);
        const result = checkStep(explicitMul([numerator, reciprocal]), next);

        if (result.equivalent) {
            return {
                equivalent: true,
                reasons: [
                    "dividing by a fraction is the same as multiplying by the reciprocal",
                    ...result.reasons,
                ],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const cancelingInFrac = (
    prev: Semantic.Expression,
    next: Semantic.Expression,
): Result => {
    if (prev.type === "div") {
        if (
            // Check if the numerator and denominator are the same
            checkStep(...prev.args).equivalent &&
            // Should we ever check that something is exactly ONE?
            checkStep(next, ONE).equivalent
        ) {
            return {
                equivalent: true,
                reasons: ["division by the same value"],
            };
        }

        if (checkStep(prev.args[1], ONE).equivalent) {
            const {equivalent, reasons} = checkStep(prev.args[0], next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [...reasons, "division by one"],
                };
            }
        }

        const result = checkDivisionCanceling(prev, next);
        if (result.equivalent) {
            return result;
        }
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const mulByFrac = (prev: Semantic.Expression, next: Semantic.Expression) => {
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
    const {equivalent, reasons} = checkStep(
        next,
        div(mulFactors(numFactors), mulFactors(denFactors)),
    );
    return {
        equivalent,
        reasons: equivalent ? ["multiplying fractions", ...reasons] : [],
    };
};

const mulByZero = (prev: Semantic.Expression, next: Semantic.Expression) => {
    if (prev.type !== "mul") {
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: ensure that reasons from these calls to checkStep
    // are captured.
    const hasZero = prev.args.some(arg => checkStep(arg, ZERO).equivalent);
    const {equivalent, reasons} = checkStep(next, ZERO);
    if (hasZero && equivalent) {
        return {
            equivalent: true,
            reasons: [...reasons, "multiplication by zero"],
        };
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const commuteAddition = (a: Semantic.Expression, b: Semantic.Expression) => {
    if (
        a.type === "add" &&
        b.type === "add" &&
        a.args.length === b.args.length
    ) {
        const pairs = zip(a.args, b.args);
        // TODO: get commutative reasons
        const commutative = pairs.some(pair => !checkStep(...pair).equivalent);
        const {reasons, equivalent} = checkArgs(a, b);
        if (commutative && equivalent) {
            return {
                equivalent,
                reasons: ["commutative property", ...reasons],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const evaluateMul = (a: Semantic.Expression, b: Semantic.Expression) => {
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

    const commonTerms = intersection(aNumTerms, bNumTerms);
    const aUniqFactors = difference(aNumTerms, commonTerms);
    const bUniqFactors = difference(bNumTerms, commonTerms);

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
                reasons: ["evaluation of multiplication"],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const evaluateAdd = (a: Semantic.Expression, b: Semantic.Expression) => {
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

    const commonTerms = intersection(aNumTerms, bNumTerms);
    const aUniqTerms = difference(aNumTerms, commonTerms);
    const bUniqTerms = difference(bNumTerms, commonTerms);

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
                reasons: ["evaluation of addition"],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const commuteMultiplication = (
    a: Semantic.Expression,
    b: Semantic.Expression,
) => {
    if (
        a.type === "mul" &&
        b.type === "mul" &&
        a.args.length === b.args.length
    ) {
        const pairs = zip(a.args, b.args);
        // TODO: get commutative reasons
        const commutative = pairs.some(pair => !checkStep(...pair).equivalent);
        const {reasons, equivalent} = checkArgs(a, b);
        if (commutative && equivalent) {
            return {
                equivalent,
                reasons: ["commutative property", ...reasons],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

const symmetricProperty = (a: Semantic.Expression, b: Semantic.Expression) => {
    if (a.type === "eq" && b.type === "eq" && a.args.length === b.args.length) {
        const pairs = zip(a.args, b.args);
        // TODO: get commutative reasons
        const commutative = pairs.some(pair => !checkStep(...pair).equivalent);
        const {reasons, equivalent} = checkArgs(a, b);
        if (commutative && equivalent) {
            return {
                equivalent,
                reasons: ["symmetric property", ...reasons],
            };
        }
    }

    return {
        equivalent: false,
        reasons: [],
    };
};

// TODO: check adding by inverse
// TODO: dividing a fraction: a/b / c -> a / bc
// TODO: add an identity check for all operations
// TODO: check removal of parens, i.e. associative property
// TODO: memoize checkStep to avoid re-doing the same work
const checkStep = (a: Semantic.Expression, b: Semantic.Expression): Result => {
    assertValid(a);
    assertValid(b);

    let result;

    result = evaluateMul(a, b);
    if (result.equivalent) {
        return result;
    }

    result = evaluateAdd(a, b);
    if (result.equivalent) {
        return result;
    }

    result = symmetricProperty(a, b);
    if (result.equivalent) {
        return result;
    }

    result = commuteAddition(a, b);
    if (result.equivalent) {
        return result;
    }

    result = commuteMultiplication(a, b);
    if (result.equivalent) {
        return result;
    }

    result = addZero(a, b);
    if (result.equivalent) {
        return result;
    }

    result = addZero(b, a);
    if (result.equivalent) {
        return result;
    }

    result = mulOne(a, b);
    if (result.equivalent) {
        return result;
    }

    result = mulOne(b, a);
    if (result.equivalent) {
        return result;
    }

    result = divByFrac(a, b);
    if (result.equivalent) {
        return result;
    }

    result = cancelingInFrac(a, b);
    if (result.equivalent) {
        return result;
    }

    result = cancelingInFrac(b, a);
    if (result.equivalent) {
        return result;
    }

    result = checkDistribution(a, b);
    if (result.equivalent) {
        return result;
    }

    result = checkFactoring(a, b);
    if (result.equivalent) {
        return result;
    }

    // a * b/c -> ab / c
    result = mulByFrac(a, b);
    if (result.equivalent) {
        return result;
    }

    // ab / c -> a * b/c
    result = mulByFrac(b, a);
    if (result.equivalent) {
        return result;
    }

    // a * 0 -> 0
    result = mulByZero(a, b);
    if (result.equivalent) {
        return result;
    }

    // 0 -> a * 0
    result = mulByZero(b, a);
    if (result.equivalent) {
        return result;
    }

    result = checkEquationStep(a, b);
    if (result.equivalent) {
        return result;
    }

    // General check if the args are equivalent for things with args
    // than are an array and not a tuple.
    if (a.type === b.type && hasArgs(a) && hasArgs(b)) {
        return checkArgs(a, b);
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
};

export {checkStep};
