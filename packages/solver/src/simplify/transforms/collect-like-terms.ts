import {builders, types, util} from "@math-blocks/semantic";
import {print} from "@math-blocks/testing";

import {Step, Transform} from "../types";
import {simplifyMul} from "../util";

import {getCoeff} from "../../solve/util";

export const getFactors = (
    node: types.NumericNode,
): OneOrMore<types.NumericNode> => {
    if (node.type === "neg") {
        return [builders.number("-1"), ...getFactors(node.arg)];
    } else {
        return node.type === "mul" ? node.args : [node];
    }
};

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

const groupTerms = (
    terms: readonly types.NumericNode[],
): Map<types.NumericNode | null, types.NumericNode[]> => {
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

export const collectLikeTerms: Transform = (node): Step | undefined => {
    if (node.type !== "add") {
        return;
    }

    node; // ?

    const substeps: Step[] = [];
    let changed = false;

    // step 0: convert subtraction to adding the inverse
    let newSum = builders.add(
        node.args.map((term) => {
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
    } else {
        newSum = node;
    }

    // step 1: group like terms
    const groups = groupTerms(newSum.args);
    const keys = [...groups.keys()];
    // If all the terms are numbers then don't do anything, let evaluate addition handle that
    if (keys.length === 1 && keys[0] === null) {
        return undefined;
    }
    const orderedTerms: types.NumericNode[] = [];
    changed = false;
    for (const values of groups.values()) {
        if (values.length > 1) {
            changed = true;
        }
        orderedTerms.push(...values);
    }
    if (!changed) {
        return undefined;
    }
    let orderedSum = builders.add(orderedTerms);

    changed = print(newSum) !== print(orderedSum);

    if (changed) {
        substeps.push({
            message: "reorder terms so that like terms are beside each other",
            before: newSum,
            after: orderedSum,
            substeps: [],
        });
    } else {
        orderedSum = newSum;
    }

    // step 2: actually collect like terms
    // TODO: track which terms have coefficients that need evaluating
    const groupedTerms: types.NumericNode[] = [];
    for (const [key, values] of groups.entries()) {
        let newTerm: types.NumericNode;
        if (key === null) {
            newTerm = builders.add(values);
        } else {
            const coeffs = values.map(getCoeff);
            const coeff = builders.add(coeffs);
            newTerm = builders.mul([coeff, key], true);
        }
        groupedTerms.push(newTerm);
    }
    const groupedSum = builders.add(groupedTerms);

    substeps.push({
        message: "factor variable part of like terms",
        before: orderedSum,
        after: groupedSum,
        substeps: [],
    });

    // step 3: evaluate the sums
    const addedTerms: types.NumericNode[] = [];
    for (const term of util.getTerms(groupedSum)) {
        // What if there was a term that was initial a sum of numbers, we wouldn't?
        // Ideally we'd deal with it first, but we should try to be defensive and
        // make sure that we're only processing nodes created by the previous step.
        // Passthrough nodes should be ignored.
        if (term.type === "add") {
            // number group
            addedTerms.push(evalNode(term));
        } else if (term.type === "mul" && term.args.length === 2) {
            const [coeff, variable] = term.args;
            const newCoeff = evalNode(coeff);
            // use simplifyMul here to handle situations where variable has more
            // than one factor
            addedTerms.push(builders.mul([newCoeff, variable], true));
        } else {
            // passthrough
            addedTerms.push(term);
        }
    }
    const addedSum = builders.add(addedTerms);

    substeps.push({
        message: "compute new coefficients",
        before: groupedSum,
        after: addedSum,
        substeps: [],
    });

    changed = false;
    const simplifiedTerms: types.NumericNode[] = [];
    for (const term of util.getTerms(addedSum)) {
        if (term.type === "mul") {
            // simplifyMul returns the same term if nothing changed
            // TODO: collect sub-steps here
            const newTerm = simplifyMul(term);
            if (newTerm !== term) {
                changed = true;
                simplifiedTerms.push(newTerm);
            } else {
                simplifiedTerms.push(term);
            }
        } else {
            simplifiedTerms.push(term);
        }
    }
    const simplifiedSum = changed ? builders.add(simplifiedTerms) : addedSum;

    if (changed) {
        substeps.push({
            message: "simplify terms",
            before: addedSum,
            after: simplifiedSum,
            substeps: [],
        });
    }

    // step 4: convert add inserve to subtract
    changed = false;
    let finalSum = builders.add(
        util.getTerms(simplifiedSum).map((term, index) => {
            if (term.type === "neg" && index > 0) {
                changed = true;
                return builders.neg(term.arg, true);
            }
            return term;
        }),
    );
    if (changed) {
        substeps.push({
            message: "adding the inverse is the same as subtraction",
            before: simplifiedSum,
            after: finalSum,
            substeps: [],
        });
    } else {
        finalSum = simplifiedSum;
    }

    return {
        message: "collect like terms",
        before: node,
        after: finalSum,
        substeps,
    };
};
