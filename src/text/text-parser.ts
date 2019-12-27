import * as Parser from "../parser";
import * as Semantic from "../semantic/semantic";

import {lex} from "./text-lexer";

import {Token} from "./text-lexer";

// TODO: fill out this list
type Operator =
    | "add"
    | "sub"
    | "mul.exp"
    | "div"
    | "mul.imp"
    | "neg"
    | "caret"
    | "eq"
    | "nul";

type Node = Semantic.Expression;

type TextParser = Parser.IParser<Token, Node, Operator>;

const EOL: Token = {type: "eol"};

const identifier = (name: string): Semantic.Ident => ({
    type: "identifier",
    name,
});

const number = (value: string): Semantic.Num => ({type: "number", value});

const add = (args: TwoOrMore<Node>): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (args: TwoOrMore<Node>, implicit = false): Semantic.Mul => ({
    type: "mul",
    implicit,
    args,
});

const div = (numerator: Node, denominator: Node): Semantic.Div => ({
    type: "div",
    args: [numerator, denominator],
});

const neg = (arg: Node, subtraction = false): Semantic.Neg => {
    subtraction; // ?
    return {
        type: "neg",
        args: [arg],
        subtraction,
    };
};

const exp = (base: Node, exp: Node): Semantic.Exp => ({
    type: "exp",
    args: [base, exp],
});

const eq = (args: TwoOrMore<Node>): Semantic.Eq => ({
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
): Parser.PrefixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "identifier":
            return {
                parse: (): Semantic.Ident => identifier(token.name),
            };
        case "number":
            return {
                parse: (): Semantic.Num => number(token.value),
            };
        case "minus":
            return {
                parse: (parser): Semantic.Neg =>
                    neg(parser.parseWithOperator("neg"), false),
            };
        case "lparen":
            return {
                parse: (parser): Semantic.Expression => {
                    const result = parser.parse();
                    const nextToken = parser.consume();
                    if (nextToken.type !== "rparen") {
                        throw new Error("unmatched left paren");
                    }
                    return result;
                },
            };
        default:
            throw new Error(`Unexpected '${token.type}' token`);
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

const parseMulByParen = (
    parser: TextParser,
): OneOrMore<Semantic.Expression> => {
    const expr = parser.parseWithOperator("mul.imp");
    if (parser.peek().type === "lparen") {
        return [expr, ...parseMulByParen(parser)];
    }
    return [expr];
};

const getInfixParselet = (
    token: Token,
): Parser.InfixParselet<Token, Node, Operator> | null => {
    switch (token.type) {
        case "eq":
            return {op: "eq", parse: parseNaryInfix("eq")};
        case "plus":
            return {op: "add", parse: parseNaryInfix("add")};
        case "minus":
            return {op: "add", parse: parseNaryInfix("sub")};
        case "times":
            return {op: "mul.exp", parse: parseNaryInfix("mul.exp")};
        case "slash":
            return {
                op: "div",
                parse: (parser, left): Semantic.Div => {
                    parser.consume();
                    return div(left, parser.parseWithOperator("div"));
                },
            };
        case "caret":
            return {
                op: "caret",
                parse: (parser, left): Semantic.Exp => {
                    parser.consume();
                    // exponents are right-associative
                    return exp(
                        left,
                        parser.parseWithOperator("caret", "right"),
                    );
                },
            };
        case "identifier":
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        case "lparen":
            return {
                op: "mul.imp",
                parse: (parser, left): Semantic.Mul => {
                    const [right, ...rest] = parseMulByParen(parser);
                    return mul([left, right, ...rest], true);
                },
            };
        case "rparen":
            return {
                op: "nul",
                parse: (): Semantic.Expression => {
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
    const [right, ...rest] = parseNaryArgs(parser, op);
    if (op === "add" || op === "sub") {
        return add([left, right, ...rest]);
    } else if (op === "mul.imp") {
        return mul([left, right, ...rest], true);
    } else if (op === "mul.exp") {
        return mul([left, right, ...rest], false);
    } else if (op === "eq") {
        return eq([left, right, ...rest]);
    } else {
        throw new Error(`unexpected operation: ${op}`);
    }
};

const parseNaryArgs = (parser: TextParser, op: Operator): OneOrMore<Node> => {
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
    }
    const nextToken = parser.peek();

    if (
        (op === "add" || op === "sub") &&
        (nextToken.type === "plus" || nextToken.type === "minus")
    ) {
        op = nextToken.type === "minus" ? "sub" : "add";
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "mul.exp" && nextToken.type === "times") {
        return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === "mul.imp" && nextToken.type === "identifier") {
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

const getOpPrecedence = (op: Operator): number => {
    switch (op) {
        case "nul":
            return 0;
        case "eq":
            return 2;
        case "add":
            return 3;
        case "sub":
            return 3;
        case "mul.exp":
            return 5;
        case "div":
            return 6;
        case "mul.imp":
            return 7;
        case "neg":
            return 8;
        case "caret":
            return 10;
        default:
            op as never;
            throw new Error("foo");
    }
};

const textParser = Parser.parserFactory<Token, Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);

export const parse = (input: string): Node => textParser.parse(lex(input));
