import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";

const {NodeType} = Semantic;

const isZero = (node: Semantic.types.Node): boolean => {
    if (node.type === NodeType.Number && node.value === "0") {
        return true;
    } else if (node.type === NodeType.Neg) {
        return isZero(node.arg);
    } else {
        return false;
    }
};

export const dropAddIdentity: Transform = (node) => {
    if (node.type !== NodeType.Add) {
        return;
    }
    const terms = Semantic.util.getTerms(node);
    let changed = false;
    const newTerms = terms.filter((term) => {
        if (isZero(term)) {
            changed = true;
            return false;
        }
        return true;
    });
    if (!changed) {
        return;
    }
    return {
        message: "drop adding zero (additive identity)",
        before: node,
        after: Semantic.builders.add(newTerms),
        substeps: [],
    };
};
