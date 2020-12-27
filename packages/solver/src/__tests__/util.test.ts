import * as Semantic from "@math-blocks/semantic";
import {parse as _parse, print} from "@math-blocks/testing";

import {mul} from "../util";

const parse = (str: string): Semantic.Types.NumericNode =>
    _parse(str) as Semantic.Types.NumericNode;

describe("mul", () => {
    test.each`
        a        | b        | prod
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
