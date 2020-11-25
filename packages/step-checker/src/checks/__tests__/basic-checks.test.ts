import {parse} from "@math-blocks/text-parser";
import * as Editor from "@math-blocks/editor";
import {parse as _parse} from "@math-blocks/editor-parser";
import {ParsingTypes} from "@math-blocks/semantic";

import StepChecker from "../../step-checker";
import {hasArgs} from "../util";

import {checkArgs} from "../basic-checks";

const myParse = (text: string): ParsingTypes.Expression => {
    const node = Editor.print(parse(text)) as Editor.Row;
    return _parse(node);
};

describe("checkArgs", () => {
    const checker = new StepChecker();

    // TODO: move this test to util-checks.test.ts
    it("should return false immediately if the number of steps are different", () => {
        jest.spyOn(checker, "checkStep");
        expect.assertions(2);

        const sum1 = myParse("1 + 2 + 3");
        const sum2 = myParse("1 + 2 + 3 + 4");
        if (hasArgs(sum1) && hasArgs(sum2)) {
            const result = checkArgs(sum1, sum2, {
                checker,
                steps: [],
                successfulChecks: new Set<string>(),
                reversed: false,
                mistakes: [],
            });

            expect(result).toBeUndefined();
            expect(checker.checkStep).not.toHaveBeenCalled();
        }
    });
});
