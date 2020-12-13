import {checkStep} from "../checks/test-util";

describe("StepChecker", () => {
    describe("no change", () => {
        test("1 -> 1", () => {
            const result = checkStep("1", "1");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });

        test("a -> a", () => {
            const result = checkStep("a", "a");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });

        test("-1 -> -1", () => {
            const result = checkStep("-1", "-1");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });
    });
});
