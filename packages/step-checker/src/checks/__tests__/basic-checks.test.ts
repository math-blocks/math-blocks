import {parse} from "@math-blocks/text-parser";

import StepChecker from "../../step-checker";
import {hasArgs} from "../util";

import {checkArgs} from "../basic-checks";

describe("checkArgs", () => {
    const checker = new StepChecker();

    // TODO: move this test to util-checks.test.ts
    it("should return false immediately if the number of steps are different", () => {
        jest.spyOn(checker, "checkStep");
        expect.assertions(2);

        const sum1 = parse("1 + 2 + 3");
        const sum2 = parse("1 + 2 + 3 + 4");
        if (hasArgs(sum1) && hasArgs(sum2)) {
            const result = checkArgs(sum1, sum2, {
                checker,
                steps: [],
                successfulChecks: new Set<string>(),
                reversed: false,
            });

            expect(result).toBeUndefined();
            expect(checker.checkStep).not.toHaveBeenCalled();
        }
    });
});
