// @flow
import * as Parser from "./parser.js";
import * as Semantic from "./semantic.js";

// TODO: fill this list out
export type TokenType =
    | "plus"
    | "minus"
    | "star"
    | "equal"
    | "number"
    | "identifier"
    | "eol";

export type Token = {
    type: TokenType,
    value: string,
};

// TOODO: fill out this list
export type Operator = "add" | "sub" | "mul" | "div" | "neg" | "eq";

export type Node = Semantic.Expression;

type MathParser = Parser.Parser<Token, Node, Operator>;

const identifier = (name: string): Semantic.Identifier => ({
    type: "identifier",
    name,
});
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

const eq = (args: Node[]): Semantic.Eq => ({
    type: "eq",
    args,
});

const neg = (arg: Node, subtraction: boolean = false): Semantic.Neg => ({
    type: "neg",
    arg,
    subtraction,
});

const prefixParseletMap: Parser.PrefixParseletMap<Token, Node, Operator> = {
    minus: {
        parse: (parser, _) =>
            neg(
                parser.parseWithPrecedence(parser.getOpPrecedence("neg")),
                true,
            ),
    },
    identifier: {
        parse: (_, token) => identifier(token.value),
    },
    number: {
        parse: (_, token) => number(token.value),
    },
};

// most (all?) of the binary only operations will be handled by the editor
// const parseBinaryInfix = (op: Operator) => (
//     parser: MathParser,
//     left: Node,
// ): Node => {
//     parser.consume();
//     return {
//         type: op,
//         args: [left, parser.parseWithPrecedence(parser.getOpPrecedence(op))],
//     };
// };

const parseNaryInfix = (op: Operator) => (
    parser: MathParser,
    left: Node,
): Node => {
    if (op === "add" || op === "sub") {
        return add([left, ...parseNaryArgs(parser, op)]);
    } else if (op === "mul") {
        return mul([left, ...parseNaryArgs(parser, op)], true);
    } else {
        return eq([left, ...parseNaryArgs(parser, op)]);
    }
};

const parseNaryArgs = (parser: MathParser, op: Operator): Node[] => {
    // TODO: handle implicit multiplication
    const token = parser.peek();
    if (token.type === "identifier") {
        // implicit multiplication
    } else {
        parser.consume();
    }
    let expr: Node = parser.parseWithPrecedence(parser.getOpPrecedence(op));
    if (op === "sub") {
        expr = {type: "neg", subtraction: true, arg: expr};
        op = "add";
    }
    const nextToken = parser.peek();
    if (op === "add" && nextToken.type === "plus") {
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "mul" && nextToken.type === "identifier") {
        // implicit multiplication
        return [expr, ...parseNaryArgs(parser, op)];
    } else {
        return [expr];
    }
};

const infixParseletMap: Parser.InfixParseletMap<Token, Node, Operator> = {
    plus: {op: "add", parse: parseNaryInfix("add")},
    minus: {op: "add", parse: parseNaryInfix("sub")},
    equal: {op: "eq", parse: parseNaryInfix("eq")},
    identifier: {op: "mul", parse: parseNaryInfix("mul")},
};

const getOpPrecedence = (op: Operator) => {
    switch (op) {
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
        default:
            (op: empty);
            throw new Error("foo");
    }
};

const EOL = {
    type: "eol",
    value: "",
};

const parser = new Parser.Parser<Token, Node, Operator>(
    infixParseletMap,
    prefixParseletMap,
    getOpPrecedence,
    EOL,
);

export default parser;
