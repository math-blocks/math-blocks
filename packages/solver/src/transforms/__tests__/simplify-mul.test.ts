import * as Semantic from "@math-blocks/semantic";
import {parse as _parse, print} from "@math-blocks/testing";

import {simplifyMul} from "../simplify-mul";

const parse = (str: string): Semantic.Types.NumericNode =>
    _parse(str) as Semantic.Types.NumericNode;

describe("simplify multiplication", () => {
    test.each`
        input             | output
        ${"(-a)(b)(c)"}   | ${"-abc"}
        ${"(a)(b)(-c)"}   | ${"-abc"}
        ${"(-a)(-b)(c)"}  | ${"abc"}
        ${"(-a)(-b)(-c)"} | ${"-abc"}
    `("isNegative($input) -> $output", ({input, output}) => {
        const result = simplifyMul(parse(input), []);

        if (!result) {
            throw new Error("no result");
        }

        expect(print(result.after)).toEqual(output);
    });
});
