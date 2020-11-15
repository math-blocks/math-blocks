import {shortest} from "./strategies";

import {
    numberCheck,
    identifierCheck,
    exactMatch,
    checkArgs,
} from "./checks/basic-checks";
import {
    symmetricProperty,
    commuteAddition,
    commuteMultiplication,
    addZero,
    mulOne,
    checkDistribution,
    mulByZero,
} from "./checks/axiom-checks";
import {checkAddSub, checkMul, checkDiv} from "./checks/equation-checks";
import {evalMul, evalAdd} from "./checks/eval-checks";
import {
    addInverse,
    subIsNeg,
    mulTwoNegsIsPos,
    doubleNegative,
    negIsMulNegOne,
    moveNegToFirstFactor,
    moveNegInsideMul,
} from "./checks/integer-checks";
import {
    divByFrac,
    divBySame,
    mulByFrac,
    mulInverse,
    divIsMulByOneOver,
    checkDivisionCanceling,
} from "./checks/fraction-checks";

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

// We'll want to eventually be able to describe hierarchical relations
// between steps in addition sequential relations.
// We still want each step to be responsible for deciding how to combine
// the result of checkStep with the new reason.

// TODO: check adding by inverse
// TODO: dividing a fraction: a/b / c -> a / bc
// TODO: add an identity check for all operations
// TODO: check removal of parens, i.e. associative property
// TODO: handle roots and other things that don't pass the hasArgs test

export const ALL_CHECKS = [
    // basic checks
    numberCheck,
    identifierCheck,
    exactMatch,

    // axiom checks
    symmetricProperty,
    commuteAddition, // should appear before addZero
    commuteMultiplication, // should appear before mulOne
    addZero,
    mulOne,
    mulByZero,

    // We do this after axiom checks so that we can include commute steps
    // first and then check if there's an exact match.  checkArgs ignores
    // ordering of args so if we ran it first we'd never see any commute
    // steps in the output.
    checkArgs,

    // equation checks
    checkAddSub,
    checkMul,
    checkDiv,
    evalMul,
    evalAdd,

    // integer checks
    addInverse,
    subIsNeg,

    moveNegInsideMul, // this needs to come after subIsNeg

    mulTwoNegsIsPos,
    doubleNegative,
    negIsMulNegOne,
    moveNegToFirstFactor,

    checkDistribution, // we put this to ensure simpler checks run first
    // we could avoid having to order thing carefully bu running everything
    // in parallel and picking the shortest path, but this would be very expensive

    // fraction checks
    // NOTE: these must appear after eval checks
    // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
    divByFrac,
    divBySame,
    // NOTE: When checking certain steps, both of these will return a
    // valid path with one usually being much shorter than the other.
    // We use 'fastest' to evaluate both paths and pick the shortest.
    shortest([mulByFrac, divIsMulByOneOver]),
    checkDivisionCanceling,

    // divBySame is equivalent to [divIsMulByOneOver, mulInverse]
    // TODO: nest steps in a hierarchy
    mulInverse,
];
