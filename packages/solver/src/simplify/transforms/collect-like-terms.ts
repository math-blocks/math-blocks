import {builders, types, util} from "@math-blocks/semantic";
import {print} from "@math-blocks/testing";

import {Step, Transform} from "../types";
import {simplifyMul} from "../util";

import {getCoeff} from "../../solve/util";

export const collectLikeTerms: Transform = (node): Step | undefined => {
    if (node.type !== "add") {
        return;
    }

    const substeps: Step[] = [];

    const newSum = subToAddNeg(node, substeps);
    const groups = getGroups(newSum.args);
    const orderedSum = orderTerms(newSum, groups, substeps);

    if (!orderedSum) {
        return;
    }

    let newNode = groupTerms(orderedSum, groups, substeps);
    newNode = evaluteCoeffs(newNode, substeps);
    newNode = simplifyTerms(newNode, substeps);
    newNode = addNegToSub(newNode, substeps);

    return {
        message: "collect like terms",
        before: node,
        after: newNode,
        substeps,
    };
};

type Groups = Map<types.NumericNode | null, types.NumericNode[]>;

/**
 * Given an array of terms, it groups them in a map where the key is the variable
 * part of the term and the value is an array of all terms of that type.
 */
const getGroups = (terms: readonly types.NumericNode[]): Groups => {
    const map = new Map<types.NumericNode | null, types.NumericNode[]>();

    for (const term of terms) {
        if (util.isNumber(term)) {
            const key = null;
            if (!map.has(key)) {
                map.set(null, [term]);
            } else {
                map.get(key)?.push(term);
            }
            continue;
        }

        const factors = fancyGetFactors(term);

        const nonNumericFactors = factors.filter((f) => !util.isNumber(f));
        const varPart = builders.mul(nonNumericFactors, true);

        let key: types.NumericNode | null = null;
        for (const k of map.keys()) {
            if (util.deepEquals(k, varPart)) {
                key = k;
            }
        }
        if (!key) {
            map.set(varPart, [term]);
        } else {
            map.get(key)?.push(term);
        }
    }

    return map;
};

/**
 * Convert any subtraction with the `node` to be addition of the inverse, e.g.
 * a - b -> a + -b
 *
 * TODO: add a substep to get rid of double negatives if it exists
 *
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const subToAddNeg = (node: types.Add, substeps: Step[]): types.Add => {
    let changed = false;

    // step 0: convert subtraction to adding the inverse
    const newSum = builders.add(
        util.getTerms(node).map((term) => {
            if (util.isSubtraction(term)) {
                changed = true;
                return builders.neg(term.arg, false);
            }
            return term;
        }),
    ) as types.Add;

    if (changed) {
        substeps.push({
            message: "subtraction is the same as adding the inverse",
            before: node,
            after: newSum,
            substeps: [],
        });
        return newSum;
    }

    return node;
};

/**
 * Reorder terms if necessary so that like terms are next to each other, e.g.
 * 2x + 3y + x -> 2x + x + 3y.
 *
 * @param node
 * @param groups
 * @param substeps this argument can be mutated by this function.
 */
const orderTerms = (
    node: types.NumericNode,
    groups: Groups,
    substeps: Step[],
): types.NumericNode | undefined => {
    const keys = [...groups.keys()];

    // If all terms are numbers then don't do anything, let evalAdd handle it.
    if (keys.length === 1 && keys[0] === null) {
        return undefined;
    }

    let changed = false;
    const newTerms: types.NumericNode[] = [];
    for (const values of groups.values()) {
        if (values.length > 1) {
            changed = true;
        }
        newTerms.push(...values);
    }

    if (!changed) {
        return undefined;
    }

    // It's possible that the terms were already ordered with like terms beside
    // each other.
    const orderedSum = builders.add(newTerms);
    if (print(node) !== print(orderedSum)) {
        substeps.push({
            message: "reorder terms so that like terms are beside each other",
            before: node,
            after: orderedSum,
            substeps: [],
        });
        return orderedSum;
    }

    return node;
};

/**
 * This function always returns a new node.
 * @param node
 * @param groups
 * @param substeps this argument will be mutated by this function.
 */
const groupTerms = (
    node: types.NumericNode,
    groups: Groups,
    substeps: Step[],
): types.NumericNode => {
    const newTerms: types.NumericNode[] = [];
    for (const [key, values] of groups.entries()) {
        let newTerm: types.NumericNode;
        if (key === null) {
            newTerm = builders.add(values);
        } else {
            const coeffs = values.map(getCoeff);
            const coeff = builders.add(coeffs);
            newTerm = builders.mul([coeff, key], true);
        }
        newTerms.push(newTerm);
    }

    const newNode = builders.add(newTerms);
    substeps.push({
        message: "factor variable part of like terms",
        before: node,
        after: newNode,
        substeps: [],
    });

    return newNode;
};

/**
 * This function always returns a new node.
 * @param node
 * @param substeps this argument will be mutated by this function.
 */
const evaluteCoeffs = (
    node: types.NumericNode,
    substeps: Step[],
): types.NumericNode => {
    const newTerms = util.getTerms(node).map((term) => {
        // What if there was a term that was initial a sum of numbers, we wouldn't?
        // Ideally we'd deal with it first, but we should try to be defensive and
        // make sure that we're only processing nodes created by the previous step.
        // Passthrough nodes should be ignored.
        if (term.type === "add") {
            // number group
            return evalNode(term);
        } else if (term.type === "mul" && term.args.length === 2) {
            const [coeff, variable] = term.args;
            const newCoeff = evalNode(coeff);
            // use simplifyMul here to handle situations where variable has more
            // than one factor
            return builders.mul([newCoeff, variable], true);
        }

        // passthrough
        return term;
    });

    const newNode = builders.add(newTerms);
    substeps.push({
        message: "compute new coefficients",
        before: node,
        after: newNode,
        substeps: [],
    });

    return newNode;
};

/**
 * If there are any terms like -1x or 1x convert them to -x and x respectively.
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const simplifyTerms = (
    node: types.NumericNode,
    substeps: Step[],
): types.NumericNode => {
    let changed = false;
    const newTerms = util.getTerms(node).map((term) => {
        if (term.type === "mul") {
            // simplifyMul returns the same term if nothing changed
            // TODO: collect sub-steps here
            const newTerm = simplifyMul(term);
            if (newTerm !== term) {
                changed = true;
                return newTerm;
            }
        }
        return term;
    });

    if (changed) {
        const newNode = builders.add(newTerms);
        substeps.push({
            message: "simplify terms",
            before: node,
            after: newNode,
            substeps: [],
        });
        return newNode;
    }

    return node;
};

/**
 * Convert the addition of an inverse to subtraction, e.g. a + -b -> a - b
 * @param node
 * @param substeps this argument can be mutated by this function.
 */
const addNegToSub = (
    node: types.NumericNode,
    substeps: Step[],
): types.NumericNode => {
    let changed = false;
    const newTerms = util.getTerms(node).map((term, index) => {
        if (term.type === "neg" && index > 0) {
            changed = true;
            return builders.neg(term.arg, true);
        }
        return term;
    });

    if (changed) {
        const newNode = builders.add(newTerms);
        substeps.push({
            message: "adding the inverse is the same as subtraction",
            before: node,
            after: newNode,
            substeps: [],
        });
        return newNode;
    }

    return node;
};

//
// Utility functions
//

const getFactors = (node: types.NumericNode): OneOrMore<types.NumericNode> => {
    if (node.type === "neg") {
        return [builders.number("-1"), ...getFactors(node.arg)];
    } else {
        return node.type === "mul" ? node.args : [node];
    }
};

// TODO: add unit tests just for this
const fancyGetFactors = (
    arg: types.NumericNode,
): readonly types.NumericNode[] => {
    let factors: readonly types.NumericNode[];

    // TODO: move this logic into `getFactors`.
    if (arg.type === "div" && util.isNumber(arg.args[1])) {
        const [num, den] = arg.args;
        factors = [
            ...getFactors(num),
            // convert division in to mul-by-reciprocal
            // TODO: make this a substep
            builders.div(builders.number("1"), den),
        ];
    } else if (arg.type === "neg") {
        if (arg.arg.type === "div" && util.isNumber(arg.arg.args[1])) {
            const [num, den] = arg.arg.args;
            factors = [
                ...getFactors(num),
                // convert division in to mul-by-reciprocal
                // TODO: make this a substep
                builders.div(builders.number("1"), den),
            ];
        } else {
            factors = getFactors(arg.arg);
        }
    } else {
        factors = getFactors(arg);
    }

    return factors;
};

/**
 * Returns either a number, fraction (div), or negative (neg) node.
 */
const evalNode = (node: types.NumericNode): types.NumericNode => {
    const value = util.evalNode(node);

    const newValue =
        value.d === 1
            ? builders.number(value.n.toString())
            : builders.div(
                  builders.number(value.n.toString()),
                  builders.number(value.d.toString()),
              );

    return value.s === -1 ? builders.neg(newValue) : newValue;
};
