// @flow
import * as Editor from "./editor";
import * as Lexer from "./lexer";
import * as Semantic from "./semantic";

import {UnreachableCaseError} from "./util";

const parseChildren = (
    node: Editor.Node<Lexer.Token>[],
): Semantic.NumericExpression => {
    // TODO: implement a pratt parser
    // we need a stack to keep track of all our operators
    // we also need to specify the precedence of the those operators

    // Placeholder, returns "0"
    return {
        kind: "number",
        value: "0",
    };
};

const parseFrac = (frac: Editor.Frac<Lexer.Token>): Semantic.DivNode => {
    const dividend = parseChildren(frac.numerator.children);
    const divisor = parseChildren(frac.denominator.children);
    return {
        kind: "div",
        dividend,
        divisor,
    };
};

// Instead of the editor returning a general node, it should probably return
// a row at the top level.
const parse = (node: Editor.Node<Lexer.Token>): Semantic.Expression => {
    switch (node.type) {
        case "parens":
        case "row":
            return parseChildren(node.children);
        case "subsup": {
            const sub = node.sub && parseChildren(node.sub.children);
            const sup = node.sup && parseChildren(node.sup.children);
            // TODO: track the token in from the of the subsup and use that
            // to determine whether this is a summation, integral, limit, etc.

            // Placeholder, returns "0"
            return {
                kind: "number",
                value: "0",
            };
        }
        case "frac":
            return parseFrac(node);

        // These should be parsed
        case "atom": {
            const {value} = node;
            switch (value.kind) {
                case "number":
                    return {
                        kind: "number",
                        value: value.value,
                    };
                case "identifier":
                    return {
                        kind: "identifier",
                        name: value.name,
                    };
                case "symbol":
                    throw new Error("this symbol should already be parsed");
                default:
                    throw new UnreachableCaseError(value);
            }
        }

        default:
            throw new UnreachableCaseError(node);
    }
};
