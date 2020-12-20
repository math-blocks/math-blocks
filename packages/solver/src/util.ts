import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

const isObject = (val: unknown): val is Record<string, unknown> => {
    return typeof val === "object" && val != null;
};

// dedupe with grader
export const deepEquals = (a: unknown, b: unknown): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every((val, index) => deepEquals(val, b[index]))
        );
    } else if (isObject(a) && isObject(b)) {
        const aKeys = Object.keys(a).filter(
            (key) => key !== "id" && key !== "loc" && key !== "source",
        );
        const bKeys = Object.keys(b).filter(
            (key) => key !== "id" && key !== "loc" && key !== "source",
        );
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(
            (key) =>
                Object.prototype.hasOwnProperty.call(b, key) &&
                deepEquals(a[key], b[key]),
        );
    } else {
        return a === b;
    }
};

// TODO: dedupe with grader
export const evalNode = (node: Semantic.Types.Node): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return evalNode(node.arg).mul(new Fraction("-1"));
    } else if (node.type === "div") {
        return evalNode(node.args[0]).div(evalNode(node.args[1]));
    } else if (node.type === "add") {
        return node.args.reduce(
            (sum, term) => sum.add(evalNode(term)),
            new Fraction("0"),
        );
    } else if (node.type === "mul") {
        return node.args.reduce(
            (sum, factor) => sum.mul(evalNode(factor)),
            new Fraction("1"),
        );
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};
