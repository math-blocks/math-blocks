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
    associativeMul,
    associativeAdd,
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
    divByOne,
    divBySame,
    mulByFrac,
    mulInverse,
    divIsMulByOneOver,
    checkDivisionCanceling,
} from "./checks/fraction-checks";
import {
    powDef,
    powMul,
    powDiv,
    powNegExp,
    powOfPow,
} from "./checks/power-checks";

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

    symmetricProperty, // like commutative property but for equations
    commuteAddition, // should appear before addZero
    commuteMultiplication, // should appear before mulOne

    // checkArgs ignores the order of args so we need to run the commutative
    // checks first otherwise checkArgs would always find a solution first.
    checkArgs,

    addZero,
    mulOne,
    mulByZero,

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

    // power checks
    powMul,
    powDiv,
    powNegExp,
    powOfPow,
    powDef, // it's important that this comes after the other exponent rules.
    // this is because the other rules can be expressed in terms of
    // this rule which means that this rule would be matched first.

    checkDistribution, // we put this to ensure simpler checks run first
    // we could avoid having to order thing carefully bu running everything
    // in parallel and picking the shortest path, but this would be very expensive

    // fraction checks
    // NOTE: these must appear after eval checks
    // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
    divByFrac,
    // NOTE: checks that are equivalent to an array of checks should appear
    // above those checks in this list.
    divByOne, // equivalent to [divIsMulByOneOver, divBySame, mulOne]
    divBySame, // equivalent to [divIsMulByOneOver, mulInverse]

    // NOTE: When checking certain steps, both of these will return a
    // valid path with one usually being much shorter than the other.
    // We use 'fastest' to evaluate both paths and pick the shortest.
    shortest([mulByFrac, divIsMulByOneOver]), // TODO: make this work with filters
    checkDivisionCanceling,

    // divBySame is equivalent to [divIsMulByOneOver, mulInverse]
    // TODO: nest steps in a hierarchy
    mulInverse,

    // associtivity checks
    associativeMul,
    associativeAdd,
];
