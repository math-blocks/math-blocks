import * as Semantic from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {solve} from "../solve";

describe("solve", () => {
    describe("linear equations", () => {
        test("2x + 3x = 7 - 4", () => {
            const ast = parse("2x + 3x = 7 - 4");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3 / 5");
        });
    });
});
