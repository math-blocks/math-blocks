// @flow
import * as Semantic from "./semantic.js";

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

const getFactors = (node: Semantic.Expression): Array<Semantic.Expression> => {
    if (node.type === "mul") {
        return node.args;
    } else {
        return [node];
    }
};

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

const checkEquationStep = (a: Semantic.Eq, b: Semantic.Eq): Result => {
    const [lhsA, rhsA] = a.args;
    const [lhsB, rhsB] = b.args;
    if (lhsB.type === rhsB.type) {
        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsRemainingValues =
                lhsA.type === "add"
                    ? lhsB.args.filter(
                          argB =>
                              !lhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : lhsB.args.filter(arg => !checkStep(lhsA, arg).equivalent);

            const rhsRemainingValues =
                rhsA.type === "add"
                    ? rhsB.args.filter(
                          argB =>
                              !rhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : rhsB.args.filter(arg => !checkStep(rhsA, arg).equivalent);

            if (
                lhsRemainingValues.length === 1 &&
                rhsRemainingValues.length === 1
            ) {
                const {equivalent, reasons} = checkStep(
                    lhsRemainingValues[0],
                    rhsRemainingValues[0],
                );

                // TODO: do we want to enforce that the thing being added is exactly
                // the same or do we want to allow equivalent expressions?
                if (equivalent && reasons.length === 0) {
                    if (
                        isSubtraction(lhsRemainingValues[0]) &&
                        isSubtraction(rhsRemainingValues[0])
                    ) {
                        return {
                            equivalent: true,
                            reasons: [
                                "subtracting the same value from both sides",
                            ],
                        };
                    }
                    return {
                        equivalent: true,
                        reasons: ["adding the same value to both sides"],
                    };
                }
            }
        }
        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsRemainingValues =
                lhsA.type === "mul"
                    ? lhsB.args.filter(
                          argB =>
                              !lhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : lhsB.args.filter(arg => !checkStep(lhsA, arg).equivalent);

            const rhsRemainingValues =
                rhsA.type === "mul"
                    ? rhsB.args.filter(
                          argB =>
                              !rhsA.args.some(
                                  argA => checkStep(argA, argB).equivalent,
                              ),
                      )
                    : rhsB.args.filter(arg => !checkStep(rhsA, arg).equivalent);

            if (
                lhsRemainingValues.length === 1 &&
                rhsRemainingValues.length === 1
            ) {
                const {equivalent, reasons} = checkStep(
                    lhsRemainingValues[0],
                    rhsRemainingValues[0],
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

// TODO: check removal of parens, i.e. associative property

const checkDistributionFactoring = (
    prev: Semantic.Mul,
    next: Semantic.Add,
): Result => {
    // TODO: handle distribution across n-ary multiplication later
    if (prev.args.length === 2) {
        const [left, right] = prev.args;
        for (const [x, y] of [[left, right], [right, left]]) {
            if (y.type === "add") {
                if (y.args.length === next.args.length) {
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
                            reasons: [], // include sub-reasons from checkStep
                        };
                    }
                }
            }
        }
    }
    return {
        equivalent: false,
        reasons: [],
    };
};

const checkDisionCanceling = (a: Semantic.Div, b: Semantic.Expression) => {
    const [numeratorA, denominatorA] = a.args;
    // Include ONE as a factor to handle cases where the denominator disappears
    // or the numerator chnages to 1.
    const numFactorsA = [...getFactors(numeratorA), ONE];
    const denFactorsA = [...getFactors(denominatorA), ONE];
    const cancelableFactors = numFactorsA.filter(numFactor =>
        denFactorsA.some(
            denFactor => checkStep(numFactor, denFactor).equivalent,
        ),
    );

    const [numeratorB, denominatorB] = b.type === "div" ? b.args : [b, ONE];
    // Include ONE as a factor to handle cases where the denominator disappears
    // or the numerator chnages to 1.
    const numFactorsB = [...getFactors(numeratorB), ONE];
    const denFactorsB = [...getFactors(denominatorB), ONE];

    // TODO: make sure that we didn't add any factors to either the numerator or denominator
    const addedNumFactors = numFactorsB
        .filter(
            numFactorB =>
                !numFactorsA.some(
                    numFactorA => checkStep(numFactorA, numFactorB).equivalent,
                ),
        )
        .filter(fact => !checkStep(fact, ONE).equivalent);

    const addedDenFactors = denFactorsB
        .filter(
            denFactorB =>
                !denFactorsA.some(
                    denFactorA => checkStep(denFactorA, denFactorB).equivalent,
                ),
        )
        .filter(fact => !checkStep(fact, ONE).equivalent);

    // ensure that no extra factors were added to either the numerator
    // or denominator
    if (addedNumFactors.length > 0 || addedDenFactors.length > 0) {
        // TODO: add reason for why the canceling check failed
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // What about duplicate factors?
    const removedNumFactors = numFactorsA.filter(
        numFactorA =>
            !numFactorsB.some(
                numFactorB => checkStep(numFactorA, numFactorB).equivalent,
            ),
    );
    const remainingNumFactors = numFactorsA.filter(numFactorA =>
        numFactorsB.some(
            numFactorB => checkStep(numFactorA, numFactorB).equivalent,
        ),
    );
    const removedDenFactors = denFactorsA.filter(
        denFactorA =>
            !denFactorsB.some(
                denFactorB => checkStep(denFactorA, denFactorB).equivalent,
            ),
    );
    const remainingDenFactors = denFactorsA.filter(denFactorA =>
        denFactorsB.some(
            denFactorB => checkStep(denFactorA, denFactorB).equivalent,
        ),
    );

    // TODO: memoize checkStep to avoid re-doing the same work

    // check that the same factors were removed from the numerator and
    // denominator.
    if (
        // TODO: helper function to check that two arrays of expressions
        // are the same.  We should be able to leverage this for checking
        // commutative property.  We'll want one version where order matters
        // and one where it doesn't.
        removedNumFactors.length > 0 &&
        removedNumFactors.length === removedDenFactors.length &&
        removedNumFactors.every(removedNumFactor =>
            removedDenFactors.some(
                remmovedDenFactor =>
                    checkStep(removedNumFactor, remmovedDenFactor).equivalent,
            ),
        )
    ) {
        const productA = explicitMul([
            div(mulFactors(removedNumFactors), mulFactors(removedDenFactors)),
            div(
                mulFactors(remainingNumFactors),
                mulFactors(remainingDenFactors),
            ),
        ]);
        remainingDenFactors; // ?

        const productB = explicitMul([ONE, b]);
        b; // ?
        productA.args[0]; //?
        productA.args[1]; //?

        // TODO: uncomment after checking if the numerator and denominator are the same
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

const checkStep = (a: Semantic.Expression, b: Semantic.Expression): Result => {
    assertValid(a);
    assertValid(b);

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

    // The nice thing about these checks is that they go both ways, so it's
    // completely reasonable for someone to start with `a` and then go to
    // `a + 0` and then `a + (b - b)` and so on... as well as the reverse
    // We should be able to do something to verify this by auto reversing tests
    // or something like that.
    // The reversability sometimes must be defined, e.g. in the case of a + 0 = a
    if (a.type !== b.type) {
        // handle canceling
        for (const [prev, next] of [[a, b], [b, a]]) {
            if (prev.type === "div") {
                // TODO: check if the numerator and denominator are the same
                if (
                    // should we ever check that something is exactly ONE?
                    checkStep(...prev.args).equivalent &&
                    checkStep(next, ONE).equivalent
                ) {
                    return {
                        equivalent: true,
                        reasons: ["division by the same value"],
                    };
                }

                const result = checkDisionCanceling(prev, next);
                if (result.equivalent) {
                    return result;
                }
            }
        }

        // TODO: figure out how to de-dupe this and multiplication which also
        // has an identity
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
                                reasons: [
                                    ...identityReasons,
                                    reason,
                                    ...reasons,
                                ],
                            };
                        }
                    }
                }
            }
        }

        for (const [prev, next] of [[a, b], [b, a]]) {
            if (prev.type === "mul") {
                if (next.type === "add") {
                    // TODO: handle distribution across n-ary multiplication later
                    const result = checkDistributionFactoring(prev, next);
                    if (result.equivalent) {
                        const reason =
                            a.type === "mul" ? "distribution" : "factoring";
                        return {
                            equivalent: true,
                            reasons: [reason],
                        };
                    }
                } else if (next.type === "div") {
                    // Handle multiplying by a fraction
                    if (prev.args.some(arg => arg.type === "div")) {
                        const numFactors = [];
                        const denFactors = [];
                        for (const arg of prev.args) {
                            if (arg.type === "div") {
                                const [numerator, denominator] = arg.args;
                                if (numerator.type === "mul") {
                                    numFactors.push(...numerator.args);
                                } else {
                                    numFactors.push(numerator);
                                }
                                if (denominator.type === "mul") {
                                    denFactors.push(...denominator.args);
                                } else {
                                    denFactors.push(denominator);
                                }
                            } else {
                                const numerator = arg;
                                if (numerator.type === "mul") {
                                    numFactors.push(...numerator.args);
                                } else {
                                    numFactors.push(numerator);
                                }
                            }
                        }
                        const numerator = mulFactors(numFactors);
                        const denominator = mulFactors(denFactors);
                        const result = checkStep(
                            next,
                            div(numerator, denominator),
                        );
                        if (result.equivalent) {
                            return {
                                equivalent: true,
                                reasons: ["multiplying fractions"],
                            };
                        }
                    }
                } else {
                    // TODO: ensure that reasons from these calls to checkStep
                    // are captured.
                    const hasZero = prev.args.some(
                        arg => checkStep(arg, ZERO).equivalent,
                    );
                    const {equivalent, reasons} = checkStep(next, ZERO);
                    if (hasZero && equivalent) {
                        return {
                            equivalent: true,
                            reasons: [...reasons, "multiplication by zero"],
                        };
                    }
                }
            }
            if (next.type === "div") {
                // TODO: include reasons from this step as well
                if (checkStep(next.args[1], ONE).equivalent) {
                    const {equivalent, reasons} = checkStep(prev, next.args[0]);
                    if (equivalent) {
                        return {
                            equivalent: true,
                            reasons: [...reasons, "division by one"],
                        };
                    }
                } else if (
                    // should we ever check that something is exactly ONE?
                    checkStep(prev, ONE).equivalent &&
                    checkStep(...next.args).equivalent
                ) {
                    return {
                        equivalent: true,
                        reasons: ["division by the same value"],
                    };
                }
                // TODO: check multiplying by inverse
                // TODO: check adding by inverse
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    // check canceling
    if (a.type === "div" && b.type === "div") {
        // TODO: add an identity check for all operations
        // identity check
        if (
            checkStep(a.args[0], b.args[0]).equivalent &&
            checkStep(a.args[1], b.args[1]).equivalent
        ) {
            return {
                equivalent: true,
                reasons: [],
            };
        }

        // if they aren't, try canceling
        const result = checkDisionCanceling(a, b);
        if (result.equivalent) {
            return result;
        }
    }

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

    // eliminate identity when the operations are the same
    // TODO: dedupe this code with the code when the types are different
    // TODO: also handle removing additive identity when the types are the same
    if (a.type === "mul" && b.type === "mul") {
        const [prev, next] = [a, b];
        if (prev.type === "mul") {
            const {identity, reason} = ops["mul"];
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

    // we've now assumed that both types are the same
    if (hasArgs(a) && hasArgs(b)) {
        // identity check
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
        const {reasons, equivalent} = checkArgs(a, b);

        // If the expressions aren't equal
        if (!equivalent) {
            return {equivalent: false, reasons: []};
        }

        return {
            equivalent,
            reasons,
        };
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
    } else if (a.type === "neg" && b.type === "neg") {
        return checkStep(a.args[0], b.args[0]);
    } else {
        return {
            equivalent: false,
            reasons: [],
        };
    }
};

export {checkStep};
