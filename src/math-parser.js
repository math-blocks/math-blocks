// @flow
import assert from "assert";
import * as Editor from "./editor";
import * as Lexer from "./lexer";
import * as Semantic from "./semantic";

import {UnreachableCaseError} from "./util";

const parseChildren = (
    nodes: Editor.Node<Lexer.Token>[],
): Semantic.NumericExpression => {
    const operands: Semantic.NumericExpression[] = [];
    const operators: Lexer.Symbol[] = [];

    // Instead of a for loop we need a while loop and a way to consume
    // the next token.  That way when we encounter a minus, we can grab
    // the next token right away.
    let i = 0;
    const hasNodesLeft = () => i < nodes.length;
    const getNode = () => nodes[i++];

    // TODO:
    // expand parseAtom into parseInfix
    // create a parsePrefix to handle unary minus

    const parseAtom = (atom: {
        id: number,
        type: "atom",
        value: Lexer.Token,
    }) => {
        if (atom.value.kind === "number") {
            operands.push({
                type: "number",
                value: atom.value.value,
            });
        } else if (atom.value.kind === "identifier") {
            operands.push({
                type: "identifier",
                name: atom.value.name,
            });
        } else {
            let op = atom.value;
            if (op.kind === "minus") {
                const nextNode = getNode();
                if (!nextNode) {
                    throw new Error("expected a node after the operator");
                }
                if (nextNode.type === "atom") {
                    // TODO: handle unary minus
                    parseAtom(nextNode);

                    // wrap the last operand in a "neg" node
                    const lastArg = operands.pop();
                    operands.push({
                        type: "neg",
                        subtraction: true,
                        arg: lastArg,
                    });
                }
                op = {kind: "plus"};
            }
            const lastOperator = operators[operators.length - 1];
            if (lastOperator && lastOperator.kind === op.kind) {
                return;
            }
            operators.push(op);
        }
    };

    while (hasNodesLeft()) {
        const node = getNode();
        if (node.type === "atom") {
            parseAtom(node);
        }
    }

    // console.log(operators);
    // console.log(operands);

    for (const operator of operators) {
        if (operator.kind === "plus") {
            const args = [...operands]; // copy operands
            operands.length = 0; // empty operands
            const result: Semantic.Add = {
                type: "add",
                args,
            };
            operands.push(result);
        }
    }

    // TODO: implement a pratt parser
    // we need a stack to keep track of all our operators
    // we also need to specify the precedence of the those operators

    assert.equal(operands.length, 1);
    return operands[0];
};

const parseFrac = (frac: Editor.Frac<Lexer.Token>): Semantic.Div => {
    const dividend = parseChildren(frac.numerator.children);
    const divisor = parseChildren(frac.denominator.children);
    return {
        type: "div",
        dividend,
        divisor,
    };
};

// Instead of the editor returning a general node, it should probably return
// a row at the top level.
export const parse = (node: Editor.Node<Lexer.Token>): Semantic.Expression => {
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
                type: "number",
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
                        type: "number",
                        value: value.value,
                    };
                case "identifier":
                    return {
                        type: "identifier",
                        name: value.name,
                    };
                case "symbol":
                    throw new Error("this symbol should already be parsed");
                default:
                    // $FlowFixMe
                    throw new UnreachableCaseError(value);
            }
        }

        default:
            throw new UnreachableCaseError(node);
    }
};
