import * as Semantic from "@math-blocks/semantic";

import {Transform} from "../types";
import {simplify} from "../../simplify/simplify";

export const simplifyBothSides: Transform = (node, ident) => {
    if (node.type !== "eq") {
        return undefined;
    }

    const left = simplify(node.args[0], []);
    if (node.args[1] === undefined) {
        console.log(node);
    }
    const right = simplify(node.args[1], []);

    if (left && right) {
        return Semantic.eq([left.after, right.after]);
    }
    if (left) {
        return Semantic.eq([left.after, node.args[1]]);
    }
    if (right) {
        return Semantic.eq([node.args[0], right.after]);
    }

    return undefined;
};
