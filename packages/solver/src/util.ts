import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

// TODO: dedup with grader
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
