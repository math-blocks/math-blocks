import * as Semantic from "@math-blocks/semantic";
import * as Parser from "@math-blocks/parser";

import {lex, Token} from "./text-lexer";
import {TextLocation} from "./types";

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

type NAryOperator = "add" | "sub" | "mul.exp" | "mul.imp" | "eq";

type Node = Semantic.Expression<TextLocation>;

type TextParser = Parser.IParser<Token, Node, Operator>;

const EOL: Token = {type: "eol", loc: {start: -1, end: -1}};

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
                parse: (): Semantic.Ident<TextLocation> => {
                    return Semantic.identifier(token.name, token.loc);
                },
            };
        case "number":
            return {
                parse: (): Semantic.Num<TextLocation> => {
                    return Semantic.number(token.value, token.loc);
                },
            };
        case "minus":
            return {
                parse: (parser): Semantic.Neg<TextLocation> => {
                    const right = parser.parseWithOperator("neg");
                    const loc: TextLocation = {
                        start: token.loc.start,
                        end: right.loc.end,
                    };
                    return Semantic.neg(right, loc, false);
                },
            };
        case "lparen":
            return {
                // TODO: how do we include the parens in the location of the
                // parsed expression?
                parse: (parser): Semantic.Expression<TextLocation> => {
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
): OneOrMore<Semantic.Expression<TextLocation>> => {
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
                parse: (parser, left): Semantic.Div<TextLocation> => {
                    parser.consume();
                    const right = parser.parseWithOperator("div");
                    const loc: TextLocation = {
                        start: left.loc.start,
                        end: right.loc.end,
                    };
                    return Semantic.div(left, right, loc);
                },
            };
        case "caret":
            return {
                op: "caret",
                parse: (parser, left): Semantic.Exp<TextLocation> => {
                    parser.consume();
                    // exponents are right-associative
                    const right = parser.parseWithOperator("caret", "right");
                    const loc: TextLocation = {
                        start: left.loc.start,
                        end: right.loc.end,
                    };
                    return Semantic.exp(left, right, loc);
                },
            };
        case "identifier":
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        case "number":
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        case "lparen":
            return {
                op: "mul.imp",
                parse: (parser, left): Semantic.Mul<TextLocation> => {
                    const [right, ...rest] = parseMulByParen(parser);
                    const loc: TextLocation = {
                        start: left.loc.start,
                        end:
                            rest.length > 0
                                ? rest[rest.length - 1].loc.end
                                : right.loc.end,
                    };
                    return Semantic.mul([left, right, ...rest], loc, true);
                },
            };
        case "rparen":
            return {
                op: "nul",
                parse: (): Semantic.Expression<TextLocation> => {
                    throw new Error("mismatched parens");
                },
            };
        default:
            return null;
    }
};

const parseNaryInfix = (op: NAryOperator) => (
    parser: TextParser,
    left: Node,
): Node => {
    const [right, ...rest] = parseNaryArgs(parser, op);
    const loc: TextLocation = {
        start: left.loc.start,
        end: rest.length > 0 ? rest[rest.length - 1].loc.end : right.loc.end,
    };
    switch (op) {
        case "add":
        case "sub":
            return Semantic.add([left, right, ...rest], loc);
        case "mul.imp":
            return Semantic.mul([left, right, ...rest], loc, true);
        case "mul.exp":
            return Semantic.mul([left, right, ...rest], loc, false);
        case "eq":
            return Semantic.eq([left, right, ...rest], loc);
    }
};

const parseNaryArgs = (
    parser: TextParser,
    op: NAryOperator,
): OneOrMore<Node> => {
    // TODO: handle implicit multiplication
    const token = parser.peek();

    if (token.type === "identifier" || token.type === "number") {
        // implicit multiplication
    } else {
        // an explicit operation, e.g. plus, times, etc.
        parser.consume();
    }
    let expr: Node = parser.parseWithOperator(op);
    if (op === "sub") {
        const loc = {
            start: token.loc.start,
            end: expr.loc.end,
        };
        expr = Semantic.neg(expr, loc, true);
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
    }
};

const textParser = Parser.parserFactory<Token, Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);

export const parse = (input: string): Node => textParser.parse(lex(input));
