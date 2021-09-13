import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {showMeHow} from "../show-me-how";

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

describe("#showMeHow", () => {
    it("should work with equations", () => {
        const ast = parseEq("2x + 5 = 10");

        const result = showMeHow(ast, Semantic.builders.identifier("x"));

        expect(Testing.print(result)).toMatchInlineSnapshot(
            `"2x + 5 - 5 = 10 - 5"`,
        );
    });

    it("should work with expressions", () => {
        const ast = parseEq("2x + 3x");

        const result = showMeHow(ast, Semantic.builders.identifier("x"));

        expect(Testing.print(result)).toMatchInlineSnapshot(`"5x"`);
    });
});
