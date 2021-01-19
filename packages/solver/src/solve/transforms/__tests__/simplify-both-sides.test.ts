import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {Step} from "../../types";

import {simplifyBothSides} from "../simplify-both-sides";

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

const simplify = (
    node: Semantic.types.Eq,
    ident: Semantic.types.Ident,
): Step => {
    const result = simplifyBothSides(node, ident);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

describe("simplify both sides", () => {
    test("2x + 5 - 5 = 10 - 5", () => {
        const before = parseEq("2x + 5 - 5 = 10 - 5");

        const step = simplify(before, Semantic.builders.identifier("x"));

        expect(Testing.print(step.after)).toEqual("2x = 5");
    });
});
