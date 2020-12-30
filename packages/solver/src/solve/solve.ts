import * as Semantic from "@math-blocks/semantic";

import {divBothSides} from "./transforms/div-both-sides";
import {moveTermsToOneSide} from "./transforms/move-terms-to-one-side";
import {simplifyBothSides} from "./transforms/simplify-both-sides";
import {Transform} from "./types";

export const solve = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
): Semantic.Types.Node => {
    if (node.type !== "eq") {
        return node;
    }

    const transforms: Transform[] = [
        simplifyBothSides,
        moveTermsToOneSide,
        divBothSides,
    ];

    let current = node as Semantic.Types.Node;
    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next.after;
        }
    }

    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next.after;
        }
    }

    for (const transform of transforms) {
        const next = transform(current, ident);
        if (next) {
            current = next.after;
        }
    }

    return current;
};
