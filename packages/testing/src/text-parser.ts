import * as Parser from "@math-blocks/parser-factory";
import * as Semantic from "@math-blocks/semantic";

import {lex, Token} from "./text-lexer";

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

type Node = Parser.types.Node;

type TextParser = Parser.IParser<Token, Node, Operator>;

const EOL: Token = {type: "eol"};

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
                parse: (): Parser.types.Ident =>
                    Parser.builders.identifier(token.name),
            };
        case "number":
            return {
                parse: (): Parser.types.Num =>
                    Parser.builders.number(token.value),
            };
        case "minus":
            return {
                parse: (parser): Parser.types.Neg =>
                    Parser.builders.neg(parser.parseWithOperator("neg"), false),
            };
        case "lparen":
            return {
                parse: (parser): Parser.types.Node => {
                    const result = parser.parse();
                    const nextToken = parser.consume();
                    if (nextToken.type !== "rparen") {
                        throw new Error("unmatched left paren");
                    }
                    return Parser.builders.parens(result);
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

const parseMulByParen = (parser: TextParser): OneOrMore<Parser.types.Node> => {
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
                parse: (parser, left): Parser.types.Div => {
                    parser.consume();
                    return Parser.builders.div(
                        left,
                        parser.parseWithOperator("div"),
                    );
                },
            };
        case "caret":
            return {
                op: "caret",
                parse: (parser, left): Parser.types.Pow => {
                    parser.consume();
                    // exponents are right-associative
                    return Parser.builders.pow(
                        left,
                        parser.parseWithOperator("caret", "right"),
                    );
                },
            };
        case "identifier":
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        case "number":
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        case "lparen":
            return {
                op: "mul.imp",
                parse: (parser, left): Parser.types.Mul => {
                    const [right, ...rest] = parseMulByParen(parser);
                    return Parser.builders.mul([left, right, ...rest], true);
                },
            };
        case "rparen":
            return {
                op: "nul",
                parse: (): Parser.types.Node => {
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
    switch (op) {
        case "add":
        case "sub":
            return Parser.builders.add([left, right, ...rest]);
        case "mul.imp":
            return Parser.builders.mul([left, right, ...rest], true);
        case "mul.exp":
            return Parser.builders.mul([left, right, ...rest], false);
        case "eq":
            return Parser.builders.eq([left, right, ...rest]);
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
        expr = Parser.builders.neg(expr, true);
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
        case "div": // this is to encourage wrapping fractions in parens before a negative
            return 6;
        case "neg":
            return 7;
        case "mul.imp":
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

// WARNING: This function mutates `node`.
const removeExcessParens = (node: Semantic.types.Node): Semantic.types.Node => {
    const path: Semantic.types.Node[] = [];

    return Semantic.util.traverse(node, {
        enter: (node) => {
            path.push(node);
        },
        exit: (node) => {
            path.pop();
            const parent = path[path.length - 1];
            if (!parent) {
                return;
            }

            // TODO: use the precedence of the operators to determine whether
            // the parens are necessary or not.
            if (node.type === "parens") {
                const {arg} = node;
                if (parent.type === "parens") {
                    return;
                }
                if (parent.type === "mul" && parent.implicit) {
                    return arg;
                }
                if (arg.type === "identifier" || arg.type === "number") {
                    return;
                }
                if (arg.type === "mul" && parent.type === "add") {
                    return;
                }
                if (arg.type === "neg" && parent.type !== "pow") {
                    return;
                }
                return arg;
            }
        },
    });
};

export const parse = (input: string): Semantic.types.Node => {
    const result = textParser.parse(lex(input));
    return removeExcessParens(result as Semantic.types.Node);
};
