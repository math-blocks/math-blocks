import * as Editor from "@math-blocks/editor";
import * as Parser from "@math-blocks/parser-factory";
import * as Semantic from "@math-blocks/semantic";
import {types} from "@math-blocks/semantic";

import * as Lexer from "./editor-lexer";
import {locFromRange} from "./util";
import {Node} from "./types";

type Token = Node;

// TODO: fill out this list
type Operator =
    | "add"
    | "sub"
    | "mul.exp"
    | "div"
    | "mul.imp"
    | "neg"
    | "eq"
    | "supsub"
    | "nul";

type NAryOperator = "add" | "sub" | "mul.exp" | "mul.imp" | "eq";

type EditorParser = Parser.IParser<Token, Parser.Types.Node, Operator>;

const isIdentifier = (node: Token): boolean =>
    node.type === "atom" && node.value.kind === "identifier";

const getPrefixParselet = (
    token: Token,
): Parser.PrefixParselet<Token, Parser.Types.Node, Operator> => {
    switch (token.type) {
        case "atom": {
            const atom = token.value;
            switch (atom.kind) {
                case "identifier":
                    return {
                        parse: () =>
                            Parser.Util.identifier(atom.name, token.loc),
                    };
                case "number":
                    return {
                        parse: () => Parser.Util.number(atom.value, token.loc),
                    };
                case "minus":
                    return {
                        parse: (parser) => {
                            const neg = parser.parseWithOperator("neg");
                            const loc = locFromRange(token.loc, neg.loc);
                            return Parser.Util.neg(neg, false, loc);
                        },
                    };
                case "lparens":
                    return {
                        parse: (parser) => {
                            const result = parser.parse();
                            const nextToken = parser.consume();
                            if (
                                nextToken.type === "atom" &&
                                nextToken.value.kind === "rparens"
                            ) {
                                const loc = locFromRange(
                                    token.loc,
                                    nextToken.loc,
                                );
                                return Parser.Util.parens(result, loc);
                            }
                            throw new Error("unmatched left paren");
                        },
                    };
                case "ellipsis":
                    return {
                        parse: () => Parser.Util.ellipsis(token.loc),
                    };
                default:
                    throw new Error(`Unexpected '${atom.kind}' atom`);
            }
        }
        case "frac":
            return {
                parse: () => {
                    const [numerator, denominator] = token.children;
                    return Parser.Util.div(
                        editorParser.parse(numerator.children),
                        editorParser.parse(denominator.children),
                        token.loc,
                    );
                },
            };
        case "subsup":
            throw new Error(`Unexpected 'subsup' token`);
        case "row":
            throw new Error(`Unexpected 'row' token`);
        case "root":
            return {
                parse: () => {
                    const [arg, index] = token.children;
                    return Parser.Util.root(
                        editorParser.parse(arg.children),
                        index ? editorParser.parse(index.children) : undefined,
                        token.loc,
                    );
                },
            };
        default:
            token as never;
            throw new Error("unexpected token");
    }
};

// most (all?) of the binary only operations will be handled by the editor
// const parseBinaryInfix = (op: Operator) => (
//     parser: EditorParser,
//     left: Node,
// ): Node => {
//     parser.consume();
//     return {
//         type: op,
//         args: [left, parser.parseWithPrecedence(parser.getOpPrecedence(op))],
//     };
// };

const parseNaryInfix = (op: NAryOperator) => (
    parser: EditorParser,
    left: Parser.Types.Node,
): Parser.Types.Node => {
    const [right, ...rest] = parseNaryArgs(parser, op);
    const loc = locFromRange(
        left.loc,
        rest.length > 0 ? rest[rest.length - 1].loc : right.loc,
    );

    switch (op) {
        case "add":
        case "sub":
            return Parser.Util.add([left, right, ...rest], loc);
        case "mul.imp":
            return Parser.Util.mul([left, right, ...rest], true, loc);
        case "mul.exp":
            return Parser.Util.mul([left, right, ...rest], false, loc);
        case "eq":
            return Parser.Util.eq([left, right, ...rest], loc);
    }
};

/**
 * Returns an array or one or more nodes that are arguments for the given
 * operator.  All n-ary operators require at least two arguments, but the
 * first argument is already parsed by parseNaryInfix so it makes sense
 * that the return value is one or more.
 */
const parseNaryArgs = (
    parser: EditorParser,
    op: NAryOperator,
): OneOrMore<Parser.Types.Node> => {
    // TODO: handle implicit multiplication
    const token = parser.peek();
    if (token.type === "atom") {
        const atom = token.value;
        if (atom.kind === "identifier" || atom.kind === "number") {
            // implicit multiplication
        } else {
            // an explicit operation, e.g. plus, times, etc.
            parser.consume();
        }
        let expr = parser.parseWithOperator(op);
        if (op === "sub") {
            const loc = locFromRange(token.loc, expr.loc);
            expr = Parser.Util.neg(expr, true, loc);
        }
        const nextToken = parser.peek();
        if (nextToken.type !== "atom") {
            throw new Error("atom expected");
        }
        const nextAtom = nextToken.value;
        if (
            (op === "add" || op === "sub") &&
            (nextAtom.kind === "plus" || nextAtom.kind === "minus")
        ) {
            op = nextAtom.kind === "minus" ? "sub" : "add";
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "mul.exp" && nextAtom.kind === "times") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "mul.imp" && nextAtom.kind === "identifier") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "eq" && nextAtom.kind === "eq") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else {
            return [expr];
            // TODO: deal with frac, subsup, etc.
        }
    } else if (token.type === "root") {
        parser.consume();
        const [arg, index] = token.children;
        const expr = Parser.Util.root(
            editorParser.parse(arg.children),
            index ? editorParser.parse(index.children) : undefined,
            token.loc,
        );
        const nextToken = parser.peek();
        if (nextToken.type === "root" || isIdentifier(nextToken)) {
            return [expr, ...parseNaryArgs(parser, "mul.imp")];
        } else {
            return [expr];
        }
    } else if (token.type === "frac") {
        parser.consume();
        const [num, den] = token.children;
        const expr = Parser.Util.div(
            editorParser.parse(num.children),
            editorParser.parse(den.children),
            token.loc,
        );
        return [expr];
    } else {
        throw new Error(`we don't handle ${token.type} tokens yet`);
        // TODO: deal with frac, subsup, etc.
    }
};

const parseMulByParen = (
    parser: EditorParser,
): OneOrMore<Parser.Types.Node> => {
    const expr = parser.parseWithOperator("mul.imp");
    const nextToken = parser.peek();
    if (nextToken.type === "atom" && nextToken.value.kind === "lparens") {
        return [expr, ...parseMulByParen(parser)];
    }
    return [expr];
};

const getInfixParselet = (
    token: Token,
): Parser.InfixParselet<Token, Parser.Types.Node, Operator> | null => {
    switch (token.type) {
        case "atom": {
            const atom = token.value;
            switch (atom.kind) {
                case "plus":
                    return {op: "add", parse: parseNaryInfix("add")};
                case "minus":
                    return {op: "add", parse: parseNaryInfix("sub")};
                case "times":
                    return {op: "mul.exp", parse: parseNaryInfix("mul.exp")};
                case "eq":
                    return {op: "eq", parse: parseNaryInfix("eq")};
                case "identifier":
                    return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
                case "number":
                    return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
                case "lparens":
                    return {
                        op: "mul.imp",
                        parse: (parser, left): Parser.Types.Mul => {
                            const [right, ...rest] = parseMulByParen(parser);
                            const loc = locFromRange(
                                left.loc,
                                rest.length > 0
                                    ? rest[rest.length - 1].loc
                                    : right.loc,
                            );

                            return Parser.Util.mul(
                                [left, right, ...rest],
                                true, // implicit
                                loc,
                            );
                        },
                    };
                case "rparens":
                    return {
                        op: "nul",
                        parse: (): Parser.Types.Node => {
                            throw new Error("mismatched parens");
                        },
                    };
                default:
                    return null;
            }
        }
        case "subsup": {
            // TODO: we need to look the previous node so we know if we should
            // be generating a sum or product node or an exponent node.  It also
            // means we have to replace the current last.  It's essentially a
            // postfix operator like ! (factorial).
            // TODO: determine the "op" based on what left is, but we can't currently do that
            return {
                op: "supsub",
                parse: (parser: EditorParser, left: Parser.Types.Node) => {
                    parser.consume(); // consume the subsup
                    const [sub, sup] = token.children;

                    if (left.type === "identifier") {
                        if (sub) {
                            left.subscript = editorParser.parse(sub.children);
                        }
                    } else {
                        if (sub) {
                            throw new Error(
                                "subscripts are only allowed on identifiers",
                            );
                        }
                    }

                    if (sup) {
                        const loc = locFromRange(left.loc, left.loc);
                        if (loc) {
                            // Add 1 to account for the subsup itself since left
                            // is the node the supsub is being applied to
                            loc.end += 1;
                        }

                        return Parser.Util.pow(
                            left,
                            editorParser.parse(sup.children),
                            loc,
                        );
                    }

                    return left;
                },
            };
        }
        case "root": {
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        }
        case "frac": {
            return {
                op: "mul.imp",
                parse: (parser, left): Parser.Types.Node => {
                    const parselet = parseNaryInfix("mul.imp");
                    if (left.type === "div") {
                        throw new Error(
                            "An operator is required between fractions",
                        );
                    }
                    return parselet(parser, left);
                },
            };
        }
        default:
            return null;
    }
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
        case "supsub":
            return 10;
    }
};

const EOL: Token = Lexer.atom({kind: "eol"}, Lexer.location([], -1, -1));

const editorParser = Parser.parserFactory<Token, Parser.Types.Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);

// WARNING: This function mutates `node`.
const removeExcessParens = (node: types.Node): types.Node => {
    const path: types.Node[] = [];

    return Semantic.traverse(node, {
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

export const parse = (input: Editor.Row): types.Node => {
    const tokenRow = Lexer.lexRow(input);
    const result = editorParser.parse(tokenRow.children);

    return removeExcessParens(result as types.Node);
};
