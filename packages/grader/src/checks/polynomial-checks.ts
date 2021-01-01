import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

import {Check, Step} from "../types";

import {correctResult} from "./util";
import {exactMatch} from "./basic-checks";

// 2x + 3x -> 5x
export const collectLikeTerms: Check = (prev, next, context) => {
    if (prev.type !== "add") {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        types.NumericNode,
        {
            coeff: types.NumericNode;
            term: types.NumericNode;
        }[]
    >();

    const {checker} = context;

    const newTerms: types.NumericNode[] = [];
    const numberTerms: types.NumericNode[] = [];

    const beforeSteps: Step[] = [];

    for (const arg of prev.args) {
        const factors = Semantic.getFactors(arg);

        if (Semantic.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: types.NumericNode;
        let varPart: types.NumericNode;

        const numericFactors = factors.filter(Semantic.isNumber);
        const nonNumericFactors = factors.filter((f) => !Semantic.isNumber(f));

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                coeff = numericFactors[0];
                if (coeff.type === "add" || coeff.type === "mul") {
                    const originalCoeff = coeff;
                    coeff = Semantic.number(
                        Semantic.evalNode(coeff, checker.options).toString(),
                    );
                    beforeSteps.push({
                        message: "evaluate coefficient",
                        nodes: [originalCoeff, coeff],
                    });
                }
            } else {
                // If there a multiple factors that are numbers, multiply them
                // together and evaluate them.
                const mul = Semantic.mulFactors(numericFactors);
                coeff = Semantic.number(
                    Semantic.evalNode(mul, checker.options).toString(),
                );
                beforeSteps.push({
                    message: "evaluate multiplication",
                    nodes: [mul, coeff],
                });
            }
            varPart = Semantic.mulFactors(nonNumericFactors, true);
        } else {
            coeff = Semantic.number("1");
            varPart = arg;
        }

        let key: types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (exactMatch(k, varPart, context)) {
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
            newTerms.push(
                Semantic.mulFactors([
                    Semantic.addTerms(v.map(({coeff}) => coeff)),
                    ...Semantic.getFactors(k),
                ]),
            );
        } else {
            // Pass through unique terms
            newTerms.push(v[0].term);
        }
    }

    // If no terms have be collected together then return early.
    if (
        newTerms.length === 0 ||
        newTerms.length + numberTerms.length === prev.args.length
    ) {
        return;
    }

    // Place numbers at the end which is a comment convention.
    const newPrev = Semantic.addTerms([...newTerms, ...numberTerms]);
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            beforeSteps,
            result.steps,
            "collect like terms",
        );
    }

    return undefined;
};
