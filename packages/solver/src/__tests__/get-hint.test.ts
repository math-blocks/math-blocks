import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {getHint} from "../get-hint";

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

describe("#getHint", () => {
    it("should work with equations", () => {
        const ast = parseEq("2x + 5 = 10");

        const hint = getHint(ast, Semantic.builders.identifier("x"));

        expect(hint.message).toMatchInlineSnapshot(`"move terms to one side"`);
    });

    it("should work with expressions", () => {
        const ast = parseEq("2x + 3x");

        const hint = getHint(ast, Semantic.builders.identifier("x"));

        expect(hint.message).toMatchInlineSnapshot(`"collect like terms"`);
    });
});
