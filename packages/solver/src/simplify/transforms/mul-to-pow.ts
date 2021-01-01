import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

import {Transform} from "../types";

const {deepEquals} = Semantic;

export const mulToPow: Transform = (node) => {
    if (!Semantic.isNumeric(node)) {
        return;
    }
    const factors = Semantic.getFactors(node);

    if (factors.length < 2) {
        return undefined;
    }

    // map from factor to factor count
    const map = new Map<types.NumericNode, number>();

    for (const factor of factors) {
        let key: types.NumericNode | undefined;
        for (const k of map.keys()) {
            // TODO: add an option to ignore mul.implicit
            if (deepEquals(k, factor)) {
                key = k;
            }
        }
        if (!key) {
            map.set(factor, 1);
        } else {
            const val = map.get(key) as number;
            map.set(key, val + 1);
        }
    }

    if ([...map.values()].every((exp) => exp === 1)) {
        return undefined;
    }

    const newFactors: types.NumericNode[] = [];
    for (const [key, val] of map.entries()) {
        if (val === 1) {
            newFactors.push(key);
        } else {
            // Clone the key to prevent issues when modifying the AST
            const base = JSON.parse(JSON.stringify(key));
            newFactors.push(Semantic.pow(base, Semantic.number(String(val))));
        }
    }

    // TODO: mimic the implicitness of the incoming node.
    return {
        message: "repeated multiplication can be written as a power",
        before: node,
        after: Semantic.mulFactors(newFactors, true),
        substeps: [],
    };
};
