import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

import {Options, Check} from "../types";

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
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

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
            prevSum = prevSum.add(parseNode(term, checker.options));
            prevNumTerms.push(term);
        } else {
            prevNonNumTerms.push(term);
        }
    }

    const nextNumTerms: Semantic.Types.NumericExpression[] = [];
    let nextSum = new Fraction("0");
    for (const term of nextTerms) {
        if (Semantic.isNumber(term)) {
            nextSum = nextSum.add(parseNode(term, checker.options));
            nextNumTerms.push(term);
        }
    }

    // We don't recognize things like 5 + 3 -> 6 + 2 as a valid step, maybe we should
    if (nextNumTerms.length >= prevNumTerms.length) {
        return;
    }

    if (!prevSum.equals(nextSum)) {
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
            prevProduct = prevProduct.mul(parseNode(factor, checker.options));
            prevNumFactors.push(factor);
        } else {
            prevNonNumFactors.push(factor);
        }
    }

    const nextNumFactors: Semantic.Types.NumericExpression[] = [];
    let nextProduct = new Fraction("1");
    for (const factor of nextFactors) {
        if (Semantic.isNumber(factor)) {
            nextProduct = nextProduct.mul(parseNode(factor, checker.options));
            nextNumFactors.push(factor);
        }
    }

    if (!prevProduct.equals(nextProduct)) {
        return;
    }

    // We don't recognize things like 5 * 3 -> 6 * 2 as a valid step, maybe we should
    if (nextNumFactors.length >= prevNumFactors.length) {
        return;
    }

    const newPrev = Semantic.mulFactors([
        ...prevNonNumFactors,
        ...nextNumFactors,
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
