// @flow
import * as Semantic from "../semantic.js";

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
                debugger;
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
const can_commute = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" || a.type === "mul" || a.type === "eq";

type HasArgs =
    | Semantic.Add
    | Semantic.Mul
    | Semantic.Eq
    | Semantic.Neq
    | Semantic.Lt
    | Semantic.Lte
    | Semantic.Gt
    | Semantic.Gte;

const hasArgs = (a: Semantic.Expression): boolean %checks =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte";

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

const hasIdentity = <T: Semantic.Add | Semantic.Mul>(node: T) =>
    node.args.some(arg => checkStep(arg, ops[node.type].identity).equivalent);

const filterIdentity = <T: Semantic.Add | Semantic.Mul>(node: T) => {
    const {identity, op} = ops[node.type];
    return op(node.args.filter(arg => !checkStep(arg, identity).equivalent));
};

const isSubtraction = (node: Semantic.Expression): boolean %checks =>
    node.type === "neg" && node.subtraction;

// Checks either additive or multiplicative identity.
const check_identity = <T: Semantic.Add | Semantic.Mul>(a: T, b: T): Result => {
    const hasIdentityA = hasIdentity(a);
    const hasIdentityB = hasIdentity(b);
    const nonIdentityArgsA = filterIdentity(a);
    const nonIdentityArgsB = filterIdentity(b);
    if (hasIdentityA || hasIdentityB) {
        const {equivalent, reasons} = checkStep(
            nonIdentityArgsA,
            nonIdentityArgsB,
        );
        if (equivalent) {
            const {reason} = ops[a.type];
            return {
                equivalent: true,
                reasons: [...reasons, reason],
            };
        }
        // TODO: figure out a test case for this case
        return {
            equivalent: false,
            reasons: [],
        };
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const getFactors = (node: Semantic.Expression): Array<Semantic.Expression> =>
    node.type === "mul" ? node.args : [node];

const getTerms = (node: Semantic.Expression): Array<Semantic.Expression> =>
    node.type === "add" ? node.args : [node];

// filters out ONEs and will return either a Mul node or a single Expression node
const mulFactors = (
    factors: Array<Semantic.Expression>,
): Semantic.Expression => {
    const filteredFactors = factors.filter(
        factor => !checkStep(factor, ONE).equivalent,
    );
    switch (filteredFactors.length) {
        case 0:
            return ONE;
        case 1:
            return filteredFactors[0];
        default:
            return explicitMul(filteredFactors);
    }
};

const addTerms = (terms: Array<Semantic.Expression>): Semantic.Expression => {
    const filteredTerms = terms.filter(
        term => !checkStep(term, ZERO).equivalent,
    );
    switch (filteredTerms.length) {
        case 0:
            return ONE;
        case 1:
            return filteredTerms[0];
        default:
            return add(filteredTerms);
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
const intersection = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.filter(a => bs.some(b => checkStep(a, b).equivalent));

/**
 * Returns all of the elements that appear in bs but not in as.
 */
const exclusion = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.filter(a => !bs.some(b => checkStep(a, b).equivalent));

/**
 * Returns true if all every element in as is equivalent to an element in bs
 * and vice versa.
 */
const equality = (as: Semantic.Expression[], bs: Semantic.Expression[]) =>
    as.every(a => bs.some(b => checkStep(a, b).equivalent));

const checkEquationStep = (a: Semantic.Eq, b: Semantic.Eq): Result => {
    const [lhsA, rhsA] = a.args;
    const [lhsB, rhsB] = b.args;
    if (lhsB.type === rhsB.type) {
        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsNewTerms = exclusion(getTerms(lhsB), getTerms(lhsA));
            const rhsNewTerms = exclusion(getTerms(rhsB), getTerms(rhsA));
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
            const lhsNewFactors = exclusion(getFactors(lhsB), getFactors(lhsA));
            const rhsNewFactors = exclusion(getFactors(rhsB), getFactors(rhsA));
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
    // TODO: handle distribution across n-ary multiplication later
    if (prev.args.length === 2) {
        const [left, right] = prev.args;
        for (const [x, y] of [[left, right], [right, left]]) {
            if (y.type === "add" && y.args.length === next.args.length) {
                const equivalent = next.args.every((arg, index) => {
                    return checkStep(
                        arg,
                        // NOTE: we don't care if multiplication is implicit
                        // or not when checking steps
                        mul(prev.implicit)([x, y.args[index]]),
                    ).equivalent;
                });

                if (equivalent) {
                    return {
                        equivalent: true,
                        reasons: ["distribution"], // include sub-reasons from checkStep
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
    // TODO: handle distribution across n-ary multiplication later
    if (next.args.length === 2) {
        const [left, right] = next.args;
        for (const [x, y] of [[left, right], [right, left]]) {
            if (y.type === "add" && y.args.length === prev.args.length) {
                const equivalent = prev.args.every((arg, index) => {
                    return checkStep(
                        arg,
                        // NOTE: we don't care if multiplication is implicit
                        // or not when checking steps
                        mul(next.implicit)([x, y.args[index]]),
                    ).equivalent;
                });

                if (equivalent) {
                    return {
                        equivalent: true,
                        reasons: ["factoring"], // include sub-reasons from checkStep
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

const checkDivisionCanceling = (a: Semantic.Div, b: Semantic.Expression) => {
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
    const addedNumFactors = exclusion(numFactorsB, numFactorsA);
    const addedDenFactors = exclusion(denFactorsB, denFactorsA);
    if (
        !checkStep(mulFactors(addedNumFactors), ONE).equivalent ||
        !checkStep(mulFactors(addedDenFactors), ONE).equivalent
    ) {
        // TODO: Add reason for why the canceling check failed
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // TODO: figure out how to handle duplicate factors
    const removedNumFactors = exclusion(numFactorsA, numFactorsB);
    const remainingNumFactors = intersection(numFactorsA, numFactorsB);
    const removedDenFactors = exclusion(denFactorsA, denFactorsB);
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
        equivalant: false,
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

// TODO: add an identity check for all operations
// TODO: check removal of parens, i.e. associative property
// TODO: memoize checkStep to avoid re-doing the same work
const checkStep = (a: Semantic.Expression, b: Semantic.Expression): Result => {
    assertValid(a);
    assertValid(b);

    // TODO: check adding by inverse
    // TODO: dividing a fraction: a/b / c -> a / bc

    // We allow any reordering of args, but we may want to restrict to
    // pair-wise reorderings in the future.
    // Not everything that has args can commute, for instance 3 > 1 is not
    // the same as 1 > 3 (the first is true, the latter is not)
    // NOTE: we only check if something can commute when the number args match
    // If the args don't match, then we first remove any identities if possible.
    if (can_commute(a) && can_commute(b) && a.args.length === b.args.length) {
        const pairs = zip(a.args, b.args);
        const commutative = pairs.some(pair => !checkStep(...pair).equivalent);
        const {reasons, equivalent} = checkArgs(a, b);
        // The rationale for equality is different
        if (commutative && equivalent) {
            const reason =
                a.type === "eq" ? "symmetric property" : "commutative property";
            return {
                equivalent,
                reasons: [reason, ...reasons],
            };
        }
    }

    // Dividing by a fraction
    if (a.type === "div") {
        const [numerator, denominator] = a.args;

        if (denominator.type === "div") {
            const reciprocal = div(denominator.args[1], denominator.args[0]);
            const result = checkStep(explicitMul([numerator, reciprocal]), b);

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
    }

    // Eliminate identities
    // [a, b] -> forward
    // [b, a] -> backwards
    for (const type: "add" | "mul" of ["add", "mul"]) {
        for (const [prev, next] of [[a, b], [b, a]]) {
            if (prev.type === type) {
                const {identity, reason} = ops[type];
                const identityReasons = [];
                const nonIdentityArgs = prev.args.filter(arg => {
                    const {equivalent, reasons} = checkStep(arg, identity);
                    if (equivalent) {
                        identityReasons.push(...reasons);
                    }
                    return !equivalent;
                });
                // TODO: collect any reasons for why an arg is equivalent
                // to the identity
                if (nonIdentityArgs.length === 1) {
                    const {equivalent, reasons} = checkStep(
                        nonIdentityArgs[0],
                        next,
                    );
                    if (equivalent) {
                        return {
                            equivalent: true,
                            reasons: [...identityReasons, reason, ...reasons],
                        };
                    }
                }
            }
        }
    }

    // Canceling in fractions
    // [a, b] -> forward
    // [b, a] -> backwards
    for (const [prev, next] of [[a, b], [b, a]]) {
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
    }

    let result;

    result = checkDistribution(a, b);
    if (result.equivalent) {
        return result;
    }

    result = checkFactoring(a, b);
    if (result.equivalent) {
        return result;
    }

    result = mulByFrac(a, b);
    if (result.equivalent) {
        return result;
    }

    result = mulByFrac(b, a);
    if (result.equivalent) {
        return result;
    }

    result = mulByZero(a, b);
    if (result.equivalent) {
        return result;
    }

    result = mulByZero(b, a);
    if (result.equivalent) {
        return result;
    }

    // we've now assumed that both types are the same
    if (hasArgs(a) && hasArgs(b)) {
        // NOTE: this is not really an identity check since the
        // number of args are different.  Here, we're checking if
        // the expression contains any identities we can eliminate
        if (a.args.length !== b.args.length) {
            if (a.type === "add" && b.type === "add") {
                return check_identity(a, b);
            }
            if (a.type === "mul" && b.type === "mul") {
                return check_identity(a, b);
            }
        }

        if (a.type === "eq" && b.type === "eq") {
            // We can't just return the result here because chekcEquationStep doesn't
            // check for swapping sides.
            const result = checkEquationStep(a, b);
            if (result.equivalent) {
                return result;
            }
        }

        return checkArgs(a, b);
    }

    // Identity Checks
    // These checks verify that the atoms are the same or, if it's an
    // operation, that the args are the same.
    // TODO: add an identity check for all operations
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
    } else if (a.type === "neg" && b.type === "neg") {
        return checkStep(a.args[0], b.args[0]);
    } else if (a.type === "div" && b.type === "div") {
        if (
            checkStep(a.args[0], b.args[0]).equivalent &&
            checkStep(a.args[1], b.args[1]).equivalent
        ) {
            return {
                equivalent: true,
                reasons: [],
            };
        }
        return {
            equivalent: false,
            reasons: [],
        };
    } else {
        return {
            equivalent: false,
            reasons: [],
        };
    }
};

export {checkStep};
