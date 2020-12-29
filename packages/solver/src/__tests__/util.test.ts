import * as Semantic from "@math-blocks/semantic";
import {parse as _parse, print} from "@math-blocks/testing";

import {mul, isNegative} from "../util";

const parse = (str: string): Semantic.Types.NumericNode =>
    _parse(str) as Semantic.Types.NumericNode;

describe("isNegative", () => {
    test.each`
        input             | output
        ${"-1"}           | ${true}
        ${"-a"}           | ${true}
        ${"--a"}          | ${false}
        ${"---a"}         | ${true}
        ${"(-a)(b)"}      | ${true}
        ${"(-a)(-b)"}     | ${false}
        ${"(-a)(-b)(-c)"} | ${true}
    `("isNegative($input) -> $output", ({input, output}) => {
        const result = isNegative(parse(input));

        expect(result).toEqual(output);
    });
});

describe("mul", () => {
    test.each`
        a        | b        | prod
        ${"1"}   | ${"1"}   | ${"1"}
        ${"-1"}  | ${"1"}   | ${"-1"}
        ${"-1"}  | ${"-1"}  | ${"1"}
        ${"1"}   | ${"-1"}  | ${"-1"}
        ${"a"}   | ${"b"}   | ${"ab"}
        ${"-a"}  | ${"b"}   | ${"-ab"}
        ${"-a"}  | ${"-b"}  | ${"ab"}
        ${"a"}   | ${"-b"}  | ${"-ab"}
        ${"1"}   | ${"ab"}  | ${"ab"}
        ${"-1"}  | ${"ab"}  | ${"-ab"}
        ${"-1"}  | ${"-ab"} | ${"ab"}
        ${"1"}   | ${"-ab"} | ${"-ab"}
        ${"2"}   | ${"3"}   | ${"6"}
        ${"-2"}  | ${"3"}   | ${"-6"}
        ${"-2"}  | ${"-3"}  | ${"6"}
        ${"2"}   | ${"-3"}  | ${"-6"}
        ${"2a"}  | ${"3b"}  | ${"6ab"}
        ${"-2a"} | ${"3b"}  | ${"-6ab"}
        ${"-2a"} | ${"-3b"} | ${"6ab"}
        ${"2a"}  | ${"-3b"} | ${"-6ab"}
        ${"ab"}  | ${"xy"}  | ${"abxy"}
        ${"-ab"} | ${"xy"}  | ${"-abxy"}
        ${"-ab"} | ${"-xy"} | ${"abxy"}
        ${"ab"}  | ${"-xy"} | ${"-abxy"}
    `("($a)($b) = $prod", ({a, b, prod}) => {
        const result = mul(parse(a), parse(b));

        expect(print(result)).toEqual(prod);
    });
});
