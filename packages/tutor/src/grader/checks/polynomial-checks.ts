import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";

import type {Check, Result} from "../types";

import {correctResult} from "./util";
import {exactMatch} from "./basic-checks";

const {NodeType} = Semantic;

// 2x + 3x -> 5x
export const collectLikeTerms: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    if (prev.type !== NodeType.Add) {
        return;
    }

    // Map from variable part to an array of coefficients.
    const map = new Map<
        Semantic.types.NumericNode,
        {
            coeff: Semantic.types.NumericNode;
            term: Semantic.types.NumericNode;
        }[]
    >();

    const {checker} = context;

    const newTerms: Semantic.types.NumericNode[] = [];
    const numberTerms: Semantic.types.NumericNode[] = [];

    const beforeSteps: Solver.Step[] = [];

    for (const arg of prev.args) {
        const factors = Semantic.util.getFactors(arg);

        if (Semantic.util.isNumber(arg)) {
            numberTerms.push(arg);
            continue;
        }

        let coeff: Semantic.types.NumericNode;
        let varPart: Semantic.types.NumericNode;

        const numericFactors = factors.filter(Semantic.util.isNumber);
        const nonNumericFactors = factors.filter(
            (f) => !Semantic.util.isNumber(f),
        );

        if (numericFactors.length > 0) {
            // If there's a single number factor then it's the coefficient
            if (numericFactors.length === 1) {
                coeff = numericFactors[0];
                if (
                    coeff.type === NodeType.Add ||
                    coeff.type === NodeType.Mul
                ) {
                    const originalCoeff = coeff;
                    coeff = Semantic.builders.number(
                        Semantic.util
                            .evalNode(coeff, checker.options)
                            .toString(),
                    );
                    beforeSteps.push({
                        message: "evaluate coefficient",
                        before: originalCoeff,
                        after: coeff,
                        substeps: [],
                    });
                }
            } else {
                // If there a multiple factors that are numbers, multiply them
                // together and evaluate them.
                const mul = Semantic.builders.mul(numericFactors);
                coeff = Semantic.builders.number(
                    Semantic.util.evalNode(mul, checker.options).toString(),
                );
                beforeSteps.push({
                    message: "evaluate multiplication",
                    before: mul,
                    after: coeff,
                    substeps: [],
                });
            }
            varPart = Semantic.builders.mul(nonNumericFactors, true);
        } else {
            coeff = Semantic.builders.number("1");
            varPart = arg;
        }

        let key: Semantic.types.NumericNode | undefined;
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
                Semantic.builders.mul([
                    Semantic.builders.add(v.map(({coeff}) => coeff)),
                    ...Semantic.util.getFactors(k),
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
    const newPrev = Semantic.builders.add([...newTerms, ...numberTerms]);
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
