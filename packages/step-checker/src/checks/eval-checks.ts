import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

import {Options, Check} from "../types";
import {MistakeId} from "../enums";

import {correctResult} from "./util";

const parseNode = (
    node: Semantic.Types.Expression,
    options: Options,
): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.arg, options).mul(new Fraction("-1"));
    } else if (node.type === "div" && options.evalFractions) {
        // TODO: add a recursive option as well
        return parseNode(node.args[0], options).div(
            parseNode(node.args[1], options),
        );
        // TODO: handle evaluating "add" and "mul"
        // TODO: include substeps when that happens
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

// TODO: when evaluating 5 - 5 or 5 + -5 then we may want to include substeps,
// e.g. "adding inverse" and "addition with identity"
export const evalAdd: Check = (prev, next, context) => {
    if (!Semantic.isNumeric(prev) || !Semantic.isNumeric(next)) {
        return;
    }

    // If neither are sums then we can stop early
    if (prev.type !== "add" && next.type !== "add") {
        return;
    }

    const prevTerms = Semantic.getTerms(prev);
    const nextTerms = Semantic.getTerms(next);

    const {checker} = context;

    const prevNonNumTerms: Semantic.Types.NumericExpression[] = [];
    const prevNumTerms: Semantic.Types.NumericExpression[] = [];
    let prevSum = new Fraction("0");
    for (const term of prevTerms) {
        if (Semantic.isNumber(term)) {
            try {
                prevSum = prevSum.add(parseNode(term, checker.options));
            } catch (e) {
                return;
            }
            prevNumTerms.push(term);
        } else {
            prevNonNumTerms.push(term);
        }
    }

    // Prevents infinite recursion
    if (prevSum.equals(0)) {
        return;
    }

    const nextNumTerms: Semantic.Types.NumericExpression[] = [];
    let nextSum = new Fraction("0");
    for (const term of nextTerms) {
        if (Semantic.isNumber(term)) {
            try {
                nextSum = nextSum.add(parseNode(term, checker.options));
            } catch (e) {
                return;
            }
            nextNumTerms.push(term);
        }
    }

    // We don't recognize things like 5 + 3 -> 6 + 2 as a valid step, maybe we should
    if (nextNumTerms.length >= prevNumTerms.length) {
        return;
    }

    // Prevents reporting unhelpful mistakes
    if (nextSum.equals(0)) {
        return;
    }

    if (!prevSum.equals(nextSum)) {
        if (context.mistakes) {
            context.mistakes.push({
                // TODO: add an optional 'correction' field to Mistake type
                // The corrections should be mappings between incorrect nodes
                // and their corrections.
                // NOTE: corrections only make sense for EVAL_ADD since in the
                // decomposition case there are multiple correct decompositions.
                id: context.reversed
                    ? MistakeId.DECOMP_ADD
                    : MistakeId.EVAL_ADD,
                prevNodes: context.reversed ? nextNumTerms : prevNumTerms,
                nextNodes: context.reversed ? prevNumTerms : nextNumTerms,
            });
        }

        return;
    }

    const newPrev = Semantic.addTerms([...prevNonNumTerms, ...nextNumTerms]);

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "evaluation of addition",
            "decompose sum",
        );
    }
};
evalAdd.symmetric = true;

// TODO: when evaluating 5 * 1/5 or 5 / 5 then we may want to include substeps,
// e.g. "multiplying inverse" and "multiplication with identity"
export const evalMul: Check = (prev, next, context) => {
    if (!Semantic.isNumeric(prev) || !Semantic.isNumeric(next)) {
        return;
    }

    // If neither are products then we can stop early
    if (prev.type !== "mul" && next.type !== "mul") {
        return;
    }

    const prevFactors = Semantic.getFactors(prev);
    const nextFactors = Semantic.getFactors(next);

    const {checker} = context;

    const prevNonNumFactors: Semantic.Types.NumericExpression[] = [];
    const prevNumFactors: Semantic.Types.NumericExpression[] = [];
    let prevProduct = new Fraction("1");
    for (const factor of prevFactors) {
        if (Semantic.isNumber(factor)) {
            try {
                prevProduct = prevProduct.mul(
                    parseNode(factor, checker.options),
                );
            } catch (e) {
                return;
            }
            prevNumFactors.push(factor);
        } else {
            prevNonNumFactors.push(factor);
        }
    }

    // Prevents infinite recursion
    if (prevProduct.equals(1)) {
        return;
    }

    const nextNumFactors: Semantic.Types.NumericExpression[] = [];
    let nextProduct = new Fraction("1");
    for (const factor of nextFactors) {
        if (Semantic.isNumber(factor)) {
            try {
                nextProduct = nextProduct.mul(
                    parseNode(factor, checker.options),
                );
            } catch (e) {
                return;
            }
            nextNumFactors.push(factor);
        }
    }

    // We don't recognize things like 5 * 3 -> 6 * 2 as a valid step, maybe we should
    if (nextNumFactors.length >= prevNumFactors.length) {
        return;
    }

    // Prevents reporting unhelpful mistakes
    if (nextProduct.equals(1)) {
        return;
    }

    if (!prevProduct.equals(nextProduct)) {
        if (context.mistakes) {
            context.mistakes.push({
                // TODO: add an optional 'correction' field to Mistake type
                // The corrections should be mappings between incorrect nodes
                // and their corrections.
                // NOTE: corrections only make sense for EVAL_MUL since in the
                // decomposition case there are multiple correct decompositions.
                id: context.reversed
                    ? MistakeId.DECOMP_MUL
                    : MistakeId.EVAL_MUL,
                prevNodes: context.reversed ? nextNumFactors : prevNumFactors,
                nextNodes: context.reversed ? prevNumFactors : nextNumFactors,
            });
        }

        return;
    }

    const newPrev = Semantic.mulFactors([
        ...nextNumFactors,
        ...prevNonNumFactors, // it's customary to put variable factors last
    ]);

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
        return correctResult(
            prev,
            newPrev,
            context.reversed,
            [],
            result.steps,
            "evaluation of multiplication",
            "decompose product",
        );
    }
};
evalMul.symmetric = true;
