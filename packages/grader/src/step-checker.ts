import * as Semantic from "@math-blocks/semantic";

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

const defaultOptions: Options = {
    skipEvalChecker: false,
    evalFractions: true,
};

class StepChecker implements IStepChecker {
    options: Options;
    checks: Check[];

    constructor(options?: Options, checks: Check[] = ALL_CHECKS) {
        this.options = {
            ...defaultOptions,
            ...options,
        };
        this.checks = checks;
    }

    checkStep: Check = (prev, next, context) => {
        // We return the first successful check.  This is necessary to reduce
        // computation to a manageable amount, but it means that the order of
        // the checks is important.
        const check = first(this.checks);

        return check(prev, next, context);
    };
}

export default StepChecker;

const checker = new StepChecker();

const areSetsEqual = <T>(a: Set<T>, b: Set<T>): boolean => {
    if (a.size === b.size) {
        return [...a.values()].every((x) => b.has(x));
    }
    return false;
};

const setOfIds = <T extends {id: number}>(array: T[]): Set<number> => {
    return new Set(array.map((item) => item.id));
};

const areMistakesEqual = (m1: Mistake, m2: Mistake): boolean => {
    if (m1.id === m2.id) {
        return (
            areSetsEqual(setOfIds(m1.prevNodes), setOfIds(m2.prevNodes)) &&
            areSetsEqual(setOfIds(m1.nextNodes), setOfIds(m2.nextNodes))
        );
    }
    return false;
};

const filterMistakes = (
    mistakes: Mistake[],
    prev: Semantic.Types.Node,
    next: Semantic.Types.Node,
): Mistake[] => {
    const prevIds: number[] = [];
    const nextIds: number[] = [];

    Semantic.traverse(prev, (node) => prevIds.push(node.id));
    Semantic.traverse(next, (node) => nextIds.push(node.id));

    // For now we only allow mistakes that reference nodes in prev or next.  If
    // a mistakes references a node in an intermediate step we ignore that for
    // now.
    const validMistakes = mistakes.filter((mistake) => {
        return (
            mistake.prevNodes.every((node) => prevIds.includes(node.id)) &&
            mistake.nextNodes.every((node) => nextIds.includes(node.id))
        );
    });

    // Deduplicate mistakes based on the message and matching node ids
    // TODO: using immutable.js would make this way easier.
    const uniqueMistakes: Mistake[] = [];
    for (const vm of validMistakes) {
        if (!uniqueMistakes.find((um) => areMistakesEqual(um, vm))) {
            uniqueMistakes.push(vm);
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
    prev: Semantic.Types.Node,
    next: Semantic.Types.Node,
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

    const result = checker.checkStep(prev, next, context);

    return {
        result,
        successfulChecks: context.successfulChecks,
        mistakes: filterMistakes(context.mistakes ?? [], prev, next),
    };
};
