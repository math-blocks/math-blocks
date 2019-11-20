// @flow
import * as Parser from "./parser.js";
import * as Semantic from "./semantic.js";
import * as Lexer from "./lexer.js";
import * as Editor from "./editor.js";

// TODO: fill this list out
export type TokenType =
    | "plus"
    | "minus"
    | "star"
    | "equal"
    | "number"
    | "identifier"

    // from editor
    | "frac"
    | "subsup"
    | "parens"

    // EOL
    | "eol";

// export type Token = {
//     type: TokenType,
//     value: string,
// };
export type Token = Editor.Node<Lexer.Token>;

// TOODO: fill out this list
export type Operator = "add" | "sub" | "mul" | "div" | "neg" | "eq" | "supsub";

export type Node = Semantic.Expression;

type MathParser = Parser.Parser<Token, Node, Operator>;

const identifier = (name: string): Semantic.Identifier => ({
    type: "identifier",
    name,
});
const number = (value: string): Semantic.Number => ({type: "number", value});
const ellipsis = (): Semantic.Ellipsis => ({type: "ellipsis"});

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
    args: [arg],
    subtraction,
});

const div = (num: Node, den: Node): Semantic.Div => ({
    type: "div",
    args: [num, den],
});

const exp = (base: Node, exp: Node): Semantic.Exp => ({
    type: "exp",
    args: [base, exp],
});

const getPrefixParselet = (
    token: Token,
): ?Parser.PrefixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "atom": {
            const atom = token.value;
            switch (atom.kind) {
                case "identifier":
                    return {
                        parse: _ => identifier(atom.name),
                    };
                case "number":
                    return {
                        parse: _ => number(atom.value),
                    };
                case "minus":
                    return {
                        parse: parser =>
                            neg(parser.parseWithOperator("neg"), true),
                    };
                case "ellipsis":
                    return {
                        parse: _ => ellipsis(),
                    };
                default:
                    return null;
            }
        }
        case "frac":
            return {
                parse: _ =>
                    div(
                        parser.parse(token.children[0].children),
                        parser.parse(token.children[1].children),
                    ),
            };
        case "subsup":
            return null;
        case "row":
            return null;
        case "parens":
            return null;
        case "root":
            return null;
        default:
            (token: empty);
            throw new Error("unexpected token");
    }
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
    if (token.type === "atom") {
        const atom = token.value;
        if (atom.kind === "identifier") {
            // implicit multiplication
        } else {
            parser.consume();
        }
        let expr: Node = parser.parseWithOperator(op);
        if (op === "sub") {
            expr = neg(expr, true);
            op = "add";
        }
        const nextToken = parser.peek();
        if (nextToken.type === "atom") {
            const nextAtom = nextToken.value;
            if (op === "add" && nextAtom.kind === "plus") {
                return [expr, ...parseNaryArgs(parser, op)];
            } else if (op === "mul" && nextAtom.kind === "identifier") {
                // implicit multiplication
                return [expr, ...parseNaryArgs(parser, op)];
            } else {
                return [expr];
            }
        } else {
            throw new Error(`we don't handle ${nextToken.type} nextTokens yet`);
            // TODO: deal with frac, subsup, etc.
        }
    } else {
        throw new Error(`we don't handle ${token.type} tokens yet`);
        // TODO: deal with frac, subsup, etc.
    }
};

const getInfixParselet = (
    token: Token,
): ?Parser.InfixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "atom": {
            const atom = token.value;
            switch (atom.kind) {
                case "plus":
                    return {op: "add", parse: parseNaryInfix("add")};
                case "minus":
                    return {op: "add", parse: parseNaryInfix("sub")};
                case "eq":
                    return {op: "eq", parse: parseNaryInfix("eq")};
                case "identifier":
                    return {op: "mul", parse: parseNaryInfix("mul")};
                default:
                    return null;
            }
        }
        case "subsup": {
            // TODO: we need to look the previous node so we know if we should
            // be generating a sum or product node or an exponent node.  It also
            // means we have to replace the current last.  It's essentially a
            // postfix operator like ! (factorial).
            const {parse} = parser;
            // TODO: determine the "op" based on what left is, but we can't currently do that
            return {
                op: "supsub",
                parse: (parser: MathParser, left: Node) => {
                    parser.consume(); // consume the subsup
                    const [sub, sup] = token.children;
                    if (left.type === "identifier") {
                        if (sub) {
                            left.subscript = parse(sub.children);
                        }
                    } else {
                        if (sub) {
                            throw new Error(
                                `subscripts aren't allowed on ${left.type} nodes`,
                            );
                        }
                    }
                    if (sup) {
                        return exp(left, parse(sup.children));
                    }

                    return left;
                },
            };
        }
        default:
            return null;
    }
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
        case "supsub":
            return 10;
        default:
            (op: empty);
            throw new Error("foo");
    }
};

const EOL: Token = Editor.atom({kind: "eol"});

const parser = Parser.parserFactory<Token, Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);

export default parser;
