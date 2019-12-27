import BigNumber from "bignumber.js";

import * as Arithmetic from "./arithmetic";
import * as Semantic from "../semantic/semantic";

import {zip} from "./util";

import FractionChecker from "./fraction-checker";
import EquationChecker from "./equation-checker";
import IntegerChecker from "./integer-checker";

// TODO: have a separate function that checks recursively
// TODO: provide a rational
const assertValid = (node: Semantic.Expression): void => {
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

const parseNode = (node: Semantic.Expression): BigNumber => {
    if (node.type === "number") {
        return new BigNumber(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.args[0]).times(new BigNumber(-1));
    } else if (node.type === "div") {
        return parseNode(node.args[0]).div(parseNode(node.args[1]));
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

export type Reason = {
    readonly message: string;
    readonly nodes: readonly Semantic.Expression[];
};

export type Result = {
    readonly equivalent: boolean;
    readonly reasons: readonly Reason[];
};

// TODO: fix flowtype/define-flow-type, HasArgs is used below
// eslint-disable-next-line no-unused-vars
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

export const hasArgs = (a: Semantic.Expression): a is HasArgs =>
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

// We'll want to eventually be able to describe hierarchical relations
// between steps in addition sequential relations.
// We still want each step to be responsible for deciding how to combine
// the result of checkStep with the new reason.

export interface IStepChecker {
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        // We pass an array of reasons since cycles may include multiple steps
        reasons: readonly Reason[],
    ): Result;
    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result;
    intersection(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): Semantic.Expression[];
    difference(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): Semantic.Expression[];
    // TODO: change this to return a Result
    equality(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): boolean;
}

class StepChecker implements IStepChecker {
    readonly fractionChecker: FractionChecker;
    readonly equationChecker: EquationChecker;
    readonly integerChecker: IntegerChecker;

    constructor() {
        this.fractionChecker = new FractionChecker(this);
        this.equationChecker = new EquationChecker(this);
        this.integerChecker = new IntegerChecker(this);
    }

    /**
     * checkArgs will return true if each node has the same args even if the
     * order doesn't match.
     */
    checkArgs<T extends HasArgs>(
        prev: T,
        next: T,
        reasons: readonly Reason[],
    ): Result {
        // eslint-disable-next-line functional/prefer-readonly-type
        const _reasons: Reason[] = [];
        if (prev.args.length !== next.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }
        const equivalent = prev.args.every(prevArg =>
            next.args.some(nextArg => {
                const result = this.checkStep(prevArg, nextArg, reasons);
                if (result.equivalent) {
                    _reasons.push(...result.reasons);
                }
                return result.equivalent;
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
    intersection(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): Semantic.Expression[] {
        return as.reduce(
            (result: Semantic.Expression[], a: Semantic.Expression) => {
                const index = bs.findIndex(
                    b => this.checkStep(a, b, reasons).equivalent,
                );
                if (index !== -1) {
                    bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
                    return [...result, a];
                }
                return result;
            },
            [],
        );
    }

    /**
     * Returns all of the elements that appear in as but not in bs.
     */
    difference(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): Semantic.Expression[] {
        return as.reduce(
            (result: Semantic.Expression[], a: Semantic.Expression) => {
                const index = bs.findIndex(
                    b => this.checkStep(a, b, reasons).equivalent,
                );
                if (index !== -1) {
                    bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
                    return result;
                } else {
                    return [...result, a];
                }
            },
            [],
        );
    }

    /**
     * Returns true if all every element in as is equivalent to an element in bs
     * and vice versa.
     */
    equality(
        as: readonly Semantic.Expression[],
        bs: readonly Semantic.Expression[],
        reasons: readonly Reason[],
    ): boolean {
        return as.every(a =>
            bs.some(b => this.checkStep(a, b, reasons).equivalent),
        );
    }

    addZero(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Arithmetic.add,
            Arithmetic.ZERO, // TODO: provide a way to have different levels of messages, e.g.
            // "adding zero doesn't change an expression"
            "addition with identity",
            reasons,
        );
    }

    mulOne(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        return this.checkIdentity(
            prev,
            next,
            Arithmetic.mul,
            Arithmetic.ONE, // TODO: provide a way to have different levels of messages, e.g.
            // "multiplying by one doesn't change an expression"
            "multiplication with identity",
            reasons,
        );
    }

    checkIdentity<T extends Semantic.Add | Semantic.Mul>(
        prev: T,
        next: Semantic.Expression,
        op: (arg0: readonly Semantic.Expression[]) => Semantic.Expression,
        identity: Semantic.Num, // conditional types would come in handy here
        reason: string,
        reasons: readonly Reason[],
    ): Result {
        // eslint-disable-next-line functional/prefer-readonly-type
        const identityReasons: Reason[] = [];
        const nonIdentityArgs = prev.args.filter(arg => {
            const result = this.checkStep(arg, identity, reasons);
            if (result.equivalent) {
                identityReasons.push(...result.reasons);
            }
            return !result.equivalent;
        });

        // If we haven't removed any identities then this check has failed
        if (nonIdentityArgs.length === prev.args.length) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const newPrev = op(nonIdentityArgs);
        const result = this.checkStep(newPrev, next, reasons);
        if (result.equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...identityReasons,
                    {
                        message: reason,
                        nodes: [],
                    },
                    ...result.reasons,
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
        return this.distributionFactoring(next, prev, "distribution");
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
                    // TODO: use exactMatch instead here... or we'll have track all
                    // of the reasons that are generated
                    const equivalent = addNode.args.every((arg, index) => {
                        const term = Arithmetic.mul([x, y.args[index]]);
                        // We reset the "reasons" parameter here because we checking
                        // different nodes so we won't run into a cycle here.
                        return this.checkStep(arg, term, []).equivalent;
                    });

                    if (equivalent) {
                        // TODO: include sub-reasons from checkStep
                        return {
                            equivalent: true,
                            reasons: [
                                {
                                    message: reason,
                                    nodes:
                                        reason === "distribution"
                                            ? [mulNode, addNode]
                                            : [addNode, mulNode],
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

    mulByZero(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (prev.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        // TODO: ensure that reasons from these calls to checkStep
        // are captured.
        const hasZero = prev.args.some(
            arg => this.checkStep(arg, Arithmetic.ZERO, reasons).equivalent,
        );
        const result = this.checkStep(next, Arithmetic.ZERO, reasons);
        if (hasZero && result.equivalent) {
            return {
                equivalent: true,
                reasons: [
                    ...result.reasons,
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

    commuteAddition(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (
            prev.type === "add" &&
            next.type === "add" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "commutative property",
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

    evaluateMul(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (a.type !== "mul" && b.type !== "mul") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aFactors = Arithmetic.getFactors(a);
        const bFactors = Arithmetic.getFactors(b);

        const aNumTerms = aFactors.filter(term => term.type === "number");
        const bNumTerms = bFactors.filter(term => term.type === "number");

        const commonTerms = this.intersection(aNumTerms, bNumTerms, reasons);
        const aUniqFactors = this.difference(aNumTerms, commonTerms, reasons);
        const bUniqFactors = this.difference(bNumTerms, commonTerms, reasons);

        if (aUniqFactors.length > 0 && bUniqFactors.length > 0) {
            const aValue = aUniqFactors.reduce(
                (prod, arg) => prod.times(parseNode(arg)),
                new BigNumber(1),
            );
            const bValue = bUniqFactors.reduce(
                (prod, arg) => prod.times(parseNode(arg)),
                new BigNumber(1),
            );
            if (aValue.isEqualTo(bValue)) {
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

    evaluateAdd(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (a.type !== "add" && b.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const aTerms = Arithmetic.getTerms(a);
        const bTerms = Arithmetic.getTerms(b);

        const aNumTerms = aTerms.filter(term => {
            try {
                parseNode(term);
                return true;
            } catch (e) {
                return false;
            }
        });
        const bNumTerms = bTerms.filter(term => {
            try {
                parseNode(term);
                return true;
            } catch (e) {
                return false;
            }
        });

        const commonTerms = this.intersection(aNumTerms, bNumTerms, reasons);
        const aUniqTerms = this.difference(aNumTerms, commonTerms, reasons);
        const bUniqTerms = this.difference(bNumTerms, commonTerms, reasons);

        if (aUniqTerms.length > 0 && bUniqTerms.length > 0) {
            const aValue = aUniqTerms.reduce(
                (sum, arg) => sum.plus(parseNode(arg)),
                new BigNumber(0),
            );
            const bValue = bUniqTerms.reduce(
                (sum, arg) => sum.plus(parseNode(arg)),
                new BigNumber(0),
            );
            if (aValue.isEqualTo(bValue)) {
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
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (
            prev.type === "mul" &&
            next.type === "mul" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "commutative property",
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

    symmetricProperty(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        if (
            prev.type === "eq" &&
            next.type === "eq" &&
            prev.args.length === next.args.length
        ) {
            const pairs = zip(prev.args, next.args);
            // TODO: get commutative reasons
            const commutative = pairs.some(
                ([first, second]) =>
                    !this.checkStep(first, second, reasons).equivalent,
            );
            const result = this.checkArgs(prev, next, reasons);
            if (commutative && result.equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "symmetric property",
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

    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result {
        if (prev.type !== next.type) {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        if (prev.type === "neg" && next.type === "neg") {
            if (prev.subtraction !== next.subtraction) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            return this.exactMatch(prev.args[0], next.args[0]);
        } else if (hasArgs(prev) && hasArgs(next)) {
            if (prev.args.length !== next.args.length) {
                return {
                    equivalent: false,
                    reasons: [],
                };
            }
            if (prev.type === "mul" && next.type === "mul") {
                // TODO: decide if we actually want to be this precise
                if (prev.implicit !== next.implicit) {
                    return {
                        equivalent: false,
                        reasons: [],
                    };
                }
            }
            // $FlowFixMe: flow doesn't like passing tuples to functions expecting arrays
            const allMatch = zip(prev.args, next.args).every(
                ([aArg, bArg]) => this.exactMatch(aArg, bArg).equivalent,
            );
            if (allMatch) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (prev.type === "number" && next.type === "number") {
            if (prev.value === next.value) {
                return {
                    equivalent: true,
                    reasons: [],
                };
            }
        } else if (prev.type === "identifier" && next.type === "identifier") {
            if (prev.name === next.name) {
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
    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        reasons: readonly Reason[],
    ): Result {
        assertValid(prev);
        assertValid(next);

        let result: Result;

        result = this.exactMatch(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = this.equationChecker.checkStep(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateMul(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.evaluateAdd(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.symmetricProperty(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteAddition(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.commuteMultiplication(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.addZero(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.integerChecker.checkStep(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.mulOne(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.fractionChecker.checkStep(prev, next, reasons);
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
        result = this.mulByZero(prev, next, reasons);
        if (result.equivalent) {
            return result;
        }

        // 0 -> a * 0
        result = this.mulByZero(next, prev, reasons);
        if (result.equivalent) {
            return result;
        }

        // General check if the args are equivalent for things with args
        // than are an array and not a tuple.
        if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
            return this.checkArgs(prev, next, reasons);
        }

        if (prev.type === "number" && next.type === "number") {
            return {
                equivalent: prev.value === next.value,
                reasons: [],
            };
        } else if (prev.type === "identifier" && next.type === "identifier") {
            return {
                equivalent: prev.name === next.name,
                reasons: [],
            };
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default StepChecker;
