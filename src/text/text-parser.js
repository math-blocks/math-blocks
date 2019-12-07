// @flow
import * as Parser from "../parser.js";
import * as Semantic from "../semantic.js";

import type {Token} from "./text-lexer.js";

// TODO: fill out this list
type Operator = "add" | "sub" | "mul" | "div" | "neg" | "caret" | "eq" | "nul";

type Node = Semantic.Expression;

type TextParser = Parser.Parser<Token, Node, Operator>;

const EOL: Token = {type: "eol"};

const identifier = (name: string) => ({type: "identifier", name});

const number = (value: string): Semantic.Number => ({type: "number", value});

const add = (args: Node[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (args: Node[], implicit: boolean = false): Semantic.Mul => ({
    type: "mul",
    implicit,
    args,
});

const div = (numerator: Node, denominator: Node): Semantic.Div => ({
    type: "div",
    args: [numerator, denominator],
});

const neg = (arg: Node, subtraction: boolean = false): Semantic.Neg => ({
    type: "neg",
    args: [arg],
    subtraction,
});

const exp = (base: Node, exp: Node): Semantic.Exp => ({
    type: "exp",
    args: [base, exp],
});

const eq = (args: Node[]): Semantic.Eq => ({
    type: "eq",
    args,
});

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
// const root = (radicand: Node, index?: Node): Semantic.Root => ({
//     type: "root",
//     args: [radicand, index || number("2")],
// });

const getPrefixParselet = (
    token: Token,
): ?Parser.PrefixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "identifier":
            return {
                parse: () => identifier(token.name),
            };
        case "number":
            return {
                parse: () => number(token.value),
            };
        case "minus":
            return {
                parse: parser => neg(parser.parseWithOperator("neg"), true),
            };
        case "lparen":
            return {
                parse: parser => {
                    const result = parser.parse();
                    const nextToken = parser.consume();
                    if (nextToken.type !== "rparen") {
                        throw new Error("unmatched left paren");
                    }
                    return result;
                },
            };
        default:
            return null;
    }
};

// let rec parseMulByParens = (parser: Parser.parser) => {
//   let expr = parser.parse(getOpPrecedence(Mul(`Implicit)));
//   switch (parser.peek(0).t) {
//   | LEFT_PAREN
//   | ELLIPSES => [expr] @ parseMulByParens(parser)
//   | _ => [expr]
//   };
// };

const parseMulByParen = (parser: TextParser) => {
    let expr = parser.parseWithOperator("mul");
    if (parser.peek().type === "lparen") {
        return [expr, ...parseMulByParen(parser)];
    }
    return [expr];
};

const getInfixParselet = (
    token: Token,
): ?Parser.InfixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "eq":
            return {op: "eq", parse: parseNaryInfix("eq")};
        case "plus":
            return {op: "add", parse: parseNaryInfix("add")};
        case "minus":
            return {op: "add", parse: parseNaryInfix("sub")};
        case "times":
            return {op: "mul", parse: parseNaryInfix("mul")};
        case "slash":
            return {
                op: "div",
                parse: (parser, left) => {
                    parser.consume();
                    return div(left, parser.parseWithOperator("div"));
                },
            };
        case "caret":
            return {
                op: "caret",
                parse: (parser, left) => {
                    parser.consume();
                    // exponents are right-associative
                    return exp(
                        left,
                        parser.parseWithOperator("caret", "right"),
                    );
                },
            };
        case "identifier":
            return {op: "mul", parse: parseNaryInfix("mul")};
        case "lparen":
            return {
                op: "mul",
                parse: (parser, left) => {
                    return mul([left, ...parseMulByParen(parser)]);
                },
            };
        case "rparen":
            return {
                op: "nul",
                parse: () => {
                    throw new Error("mismatched parens");
                },
            };
        default:
            return null;
    }
};

const parseNaryInfix = (op: Operator) => (
    parser: TextParser,
    left: Node,
): Node => {
    if (op === "add" || op === "sub") {
        return add([left, ...parseNaryArgs(parser, op)]);
    } else if (op === "mul") {
        return mul([left, ...parseNaryArgs(parser, op)], true);
    } else if (op === "eq") {
        return eq([left, ...parseNaryArgs(parser, op)]);
    } else {
        throw new Error(`unexpected operation: ${op}`);
    }
};

const parseNaryArgs = (parser: TextParser, op: Operator): Node[] => {
    // TODO: handle implicit multiplication
    const token = parser.peek();

    if (token.type === "identifier") {
        // implicit multiplication
    } else {
        // an explicit operation, e.g. plus, times, etc.
        parser.consume();
    }
    let expr: Node = parser.parseWithOperator(op);
    if (op === "sub") {
        expr = neg(expr, true);
        op = "add";
    }
    const nextToken = parser.peek();

    if (op === "add" && nextToken.type === "plus") {
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "mul" && nextToken.type === "identifier") {
        // implicit multiplication
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "eq" && nextToken.type === "eq") {
        return [expr, ...parseNaryArgs(parser, op)];
    } else {
        return [expr];
    }

    // if (token.type === "parens") {
    //     parser.consume();
    //     const expr = parser.parse(token.children);
    //     const nextToken = parser.peek();
    //     if (nextToken.type === token.type) {
    //         return [expr, ...parseNaryArgs(parser, "mul")];
    //     } else {
    //         return [expr];
    //     }
    // } else if (token.type === "root") {
    //     parser.consume();
    //     const [arg, index] = token.children;
    //     const expr = root(
    //         parser.parse(arg.children),
    //         index ? parser.parse(index.children) : undefined,
    //     );
    //     const nextToken = parser.peek();
    //     if (nextToken.type === "root" || nextToken.type === "identifier") {
    //         return [expr, ...parseNaryArgs(parser, "mul")];
    //     } else {
    //         return [expr];
    //     }
    // } else {
    //     throw new Error(`we don't handle ${token.type} tokens yet`);
    //     // TODO: deal with frac, subsup, etc.
    // }
};

const getOpPrecedence = (op: Operator) => {
    switch (op) {
        case "nul":
            return 0;
        case "eq":
            return 2;
        case "add":
            return 3;
        case "sub":
            return 3;
        case "mul":
            return 5;
        case "div":
            return 6;
        case "neg":
            return 8;
        case "caret":
            return 10;
        default:
            (op: empty);
            throw new Error("foo");
    }
};

export default Parser.parserFactory<Token, Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);
