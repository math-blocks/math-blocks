import {
    IStepChecker,
    Options,
    Context,
    Check,
    Mistake,
    Result,
    MISTAKE_PRIORITIES,
} from "./types";
import {ALL_CHECKS} from "./all-checks";
import {first} from "./strategies";
import {evalMul, evalAdd} from "./checks/eval-checks";
import {Expression} from "../../../out/semantic/src";

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

const checker = new StepChecker();

const filterMistakes = (mistakes: Mistake[]): Mistake[] => {
    // Deduplicate mistakes based on the message and matching node ids
    const uniqueMistakes: Mistake[] = [];
    for (const mistake of mistakes) {
        if (
            !uniqueMistakes.find((um) => {
                if (
                    um.id === mistake.id &&
                    um.nodes.length === mistake.nodes.length
                ) {
                    const umIds = um.nodes.map((node) => node.id);
                    const mIds = mistake.nodes.map((node) => node.id);
                    return umIds.every((id, index) => id === mIds[index]);
                }
                return false;
            })
        ) {
            uniqueMistakes.push(mistake);
        }
    }

    // Find the highest priority mistake filter out all mistakes with a
    // lower priority
    if (uniqueMistakes.length > 0) {
        const priorities = uniqueMistakes.map((mistake) => {
            return MISTAKE_PRIORITIES[mistake.id];
        });
        const maxPriority = Math.max(...priorities);
        const maxPriorityMistakes = uniqueMistakes.filter((mistake) => {
            return MISTAKE_PRIORITIES[mistake.id] === maxPriority;
        });
        return maxPriorityMistakes;
    }

    return [];
};

export const checkStep = (
    before: Expression,
    after: Expression,
): {
    result?: Result;
    successfulChecks: Set<string>;
    mistakes: Mistake[];
} => {
    const successfulChecks = new Set<string>();
    const context: Context = {
        checker,
        steps: [],
        successfulChecks,
        reversed: false,
        mistakes: [],
    };

    const result = checker.checkStep(before, after, context);

    return {
        result,
        successfulChecks: context.successfulChecks,
        mistakes: filterMistakes(context.mistakes),
    };
};
