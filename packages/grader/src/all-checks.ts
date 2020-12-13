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
    mulFrac,
    divIsMulByOneOver,
    cancelFrac,
    divByOne,
    divByFrac,
    mulInverse,
} from "./checks/new-fraction-checks";
import * as PowerChecks from "./checks/power-checks";
import {collectLikeTerms} from "./checks/polynomial-checks";

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

    mulInverse,

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
    PowerChecks.mulPowsSameBase,
    PowerChecks.divPowsSameBase,
    PowerChecks.powToZero, // we want this check to have precedence over other power checks
    PowerChecks.powOfZero, // this must come after powToZero since 0^0 -> 1
    PowerChecks.powToOne, // x^1 -> x
    PowerChecks.powOfOne, // 1^n -> 1

    PowerChecks.powNegExp, // dual of oneOverPowToNegPow
    PowerChecks.oneOverPowToNegPow, // dual of powNegExp

    PowerChecks.powOfPow,

    PowerChecks.powOfDiv, // dual of divOfPowsSameExp
    PowerChecks.divOfPowsSameExp, // dual powOfDiv

    PowerChecks.powOfMul, // dual of mulPowsSameExp
    PowerChecks.mulPowsSameExp, // dual of powOfMul

    PowerChecks.powDef, // it's important that this comes after the other exponent rules.
    // this is because the other rules can be expressed in terms of
    // this rule which means that this rule would be matched first.
    PowerChecks.powDefReverse,

    checkDistribution, // we put this to ensure simpler checks run first
    // we could avoid having to order thing carefully bu running everything
    // in parallel and picking the shortest path, but this would be very expensive

    // new fraction checks

    divByFrac,
    mulFrac,
    cancelFrac,
    divByOne,

    divIsMulByOneOver, // dual of mulFrac
    // this is the last fraction check so that don't expand a * b/c -> a * (b * 1/c)

    associativeMul,
    associativeAdd,

    // polynomial checks
    collectLikeTerms,
];
