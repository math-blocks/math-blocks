import * as Semantic from "@math-blocks/semantic";

import {Step, Transform} from "../types";
import {mul} from "../util";

const {deepEquals, evalNode} = Semantic;

// TODO: dedupe with Semantic.getFactors
export const getFactors = (
    node: Semantic.Types.NumericNode,
): OneOrMore<Semantic.Types.NumericNode> => {
    if (node.type === "neg") {
        return [Semantic.number("-1"), ...getFactors(node.arg)];
    } else {
        return node.type === "mul" ? node.args : [node];
    }
};

// TODO: dedupe with polynomial-checks.ts in grader
export const collectLikeTerms: Transform = (node) => {
    if (node.type !== "add") {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        Semantic.Types.NumericNode,
        {
            coeff: Semantic.Types.NumericNode;
            term: Semantic.Types.NumericNode;
        }[]
    >();

    const newTerms: Semantic.Types.NumericNode[] = [];
    const numberTerms: Semantic.Types.NumericNode[] = [];

    const beforeSteps: Step[] = [];

    for (const arg of node.args) {
        if (Semantic.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: Semantic.Types.NumericNode;
        let varPart: Semantic.Types.NumericNode;

        const factors = Semantic.isSubtraction(arg)
            ? getFactors(arg.arg)
            : getFactors(arg);

        // TODO: maybe restrict ourselves to nodes of type "number" or "neg"?
        const numericFactors = factors.filter(Semantic.isNumber);
        const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                // We don't have to worry about evaluating this since it should
                // be pre-evaluated by evalMul or one of the other transforms
                coeff = numericFactors[0];
            } else {
                // If there a multiple factors that are numbers, multiply them
                // together and evaluate them.
                const mul = Semantic.mulFactors(numericFactors);
                coeff = Semantic.number(evalNode(mul).toString());
                beforeSteps.push({
                    message: "evaluate multiplication",
                    before: mul,
                    after: coeff,
                    substeps: [],
                });
            }
            varPart = Semantic.mulFactors(nonNumericFactors, true);
        } else {
            if (arg.type === "neg") {
                coeff = Semantic.neg(Semantic.number("1"));
                varPart = arg.arg;
            } else {
                coeff = Semantic.number("1");
                varPart = arg;
            }
        }

        if (Semantic.isSubtraction(arg)) {
            coeff = Semantic.neg(coeff, true);
        }

        let key: Semantic.Types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (deepEquals(k, varPart)) {
                key = k;
            }
        }
        if (!key) {
            map.set(varPart, [{coeff, term: arg}]);
        } else {
            map.get(key)?.push({coeff, term: arg});
        }
    }

    for (const [k, v] of map.entries()) {
        if (v.length > 1) {
            // Collect common terms
            // TODO: make this evaluation be a sub-step
            const newCoeff = Semantic.number(
                evalNode(
                    Semantic.addTerms(v.map(({coeff}) => coeff)),
                ).toString(),
            );

            newTerms.push(mul(newCoeff, k));
        } else {
            // Pass through unique terms
            newTerms.push(v[0].term);
        }
    }

    const numbers =
        numberTerms.length > 0
            ? [
                  Semantic.number(
                      evalNode(Semantic.addTerms(numberTerms)).toString(),
                  ),
              ]
            : [];

    // If no terms have be collected together then return early.
    if (
        newTerms.length === 0 ||
        newTerms.length + numbers.length === node.args.length
    ) {
        return undefined;
    }

    // Place numbers at the end which is a comment convention.
    const after = Semantic.addTerms(
        [...newTerms, ...numbers].map((term, index) => {
            if (term.type === "mul" && term.args[0].type === "neg") {
                // TODO: make this a substep
                term.args[0] = term.args[0].arg;
                return Semantic.neg(term, index > 0);
            } else if (term.type === "neg") {
                // TODO: make this a substep if subtraction is changing
                return Semantic.neg(term.arg, index > 0);
            } else {
                return term;
            }
        }),
    );
    return {
        message: "collect like terms",
        before: node,
        after,
        substeps: [],
    };
};
