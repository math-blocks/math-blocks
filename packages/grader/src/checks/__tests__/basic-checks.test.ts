import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import StepChecker from "../../step-checker";

import {checkArgs} from "../basic-checks";

const parseEditorNodes = Editor.parse;

const myParse = (text: string): Semantic.types.Node => {
    const node = Editor.print(Testing.parse(text)) as Editor.types.CharRow;
    return parseEditorNodes(node);
};

describe("checkArgs", () => {
    const checker = new StepChecker();

    // TODO: move this test to util-checks.test.ts
    it("should return false immediately if the number of steps are different", () => {
        jest.spyOn(checker, "checkStep");
        expect.assertions(2);

        const sum1 = myParse("1 + 2 + 3");
        const sum2 = myParse("1 + 2 + 3 + 4");
        if (Semantic.util.hasArgs(sum1) && Semantic.util.hasArgs(sum2)) {
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
