import {IStepChecker, Options, Context, Check} from "./types";
import {ALL_CHECKS} from "./all-checks";
import {first} from "./strategies";
import {evalMul, evalAdd} from "./checks/eval-checks";

const filterChecks = (
    checks: Check[],
    context: Context,
    options: Options,
): Check[] => {
    const filters = context.filters;
    return checks.filter((check) => {
        if (check.unfilterable) {
            return true;
        }
        let result = true;
        if (filters && filters.allowedChecks) {
            result = result && filters.allowedChecks.has(check.name);
        }
        if (filters && filters.disallowedChecks) {
            result = result && !filters.disallowedChecks.has(check.name);
        }
        if (options.skipEvalChecker) {
            result = result && ![evalAdd, evalMul].includes(check);
        }
        return result;
    });
};

const defaultOptions: Options = {
    skipEvalChecker: false,
    evalFractions: true,
};

class StepChecker implements IStepChecker {
    options: Options;

    constructor(options?: Options) {
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    checkStep: Check = (prev, next, context) => {
        const filteredChecks = filterChecks(ALL_CHECKS, context, this.options);

        // We return the first successful check.  This is necessary to reduce
        // computation to a manageable amount, but it means that the order of
        // the checks is important.  In some cases we have to apply filters,
        // defined by some of the checks, to reduce the number of search paths
        // and avoid infinite loops.
        const check = first(filteredChecks);

        return check(prev, next, context);
    };
}

export default StepChecker;
