import {UnreachableCaseError} from "@math-blocks/core";
import * as Parser from "@math-blocks/parser-factory";
import * as Semantic from "@math-blocks/semantic";
import type {Mutable} from "utility-types";

import * as Lexer from "./lexer";
import {locFromRange} from "../token/util";
import {parseVerticalWork} from "./vertical-work";

import type {CharRow} from "../char/types";
import type {TokenNode, SourceLocation} from "../token/types";

// TODO: fill out this list
type Operator =
    | "add"
    | "sub"
    | "plusminus"
    | "mul.exp"
    | "div"
    | "mul.imp"
    | "neg"
    | "eq"
    | "supsub"
    | "nul";

type NAryOperator = "add" | "sub" | "plusminus" | "mul.exp" | "mul.imp" | "eq";

type EditorParser = Parser.IParser<TokenNode, Parser.types.Node, Operator>;

const isIdentifier = (node: TokenNode): boolean =>
    node.type === "token" && node.name === "identifier";

const getPrefixParselet = (
    node: TokenNode,
): Parser.PrefixParselet<TokenNode, Parser.types.Node, Operator> => {
    switch (node.type) {
        case "token": {
            switch (node.name) {
                case "identifier":
                    return {
                        parse: () =>
                            Parser.builders.identifier(node.value, node.loc),
                    };
                case "number":
                    return {
                        parse: () =>
                            Parser.builders.number(node.value, node.loc),
                    };
                case "minus":
                    return {
                        parse: (parser) => {
                            const neg = parser.parseWithOperator("neg");
                            const loc = locFromRange(node.loc, neg.loc);
                            return Parser.builders.neg(neg, false, loc);
                        },
                    };
                case "plusminus":
                    return {
                        parse: (parser) => {
                            const neg = parser.parseWithOperator("plusminus");
                            const loc = locFromRange(node.loc, neg.loc);
                            return Parser.builders.plusminus(neg, "unary", loc);
                        },
                    };
                case "ellipsis":
                    return {
                        parse: () => Parser.builders.ellipsis(node.loc),
                    };
                default:
                    throw new Error(`Unexpected '${node.name}' atom`);
            }
        }
        case "frac":
            return {
                parse: () => {
                    const [numerator, denominator] = node.children;
                    return Parser.builders.div(
                        editorParser.parse(numerator.children),
                        editorParser.parse(denominator.children),
                        node.loc,
                    );
                },
            };
        case "root":
            return {
                parse: () => {
                    const [index, radicand] = node.children;
                    return index === null
                        ? Parser.builders.sqrt(
                              editorParser.parse(radicand.children),
                              node.loc,
                          )
                        : Parser.builders.root(
                              editorParser.parse(radicand.children),
                              editorParser.parse(index.children),
                              node.loc,
                          );
                },
            };
        case "delimited":
            return {
                parse: () => {
                    const [inner] = node.children;
                    const result = editorParser.parse(inner.children);
                    // TODO: what should `loc` be here?
                    return Parser.builders.parens(result);
                },
            };
        case "table":
            if (node.subtype === "algebra") {
                return {
                    parse: () => {
                        return parseVerticalWork(node, editorParser);
                    },
                };
            }
            throw new Error("We don't handle 'table' tokens yet");
        // TODO: Handle subsup at the start of a row, useful in Chemistry
        case "subsup":
            throw new Error("Unexpected 'subsup' token");
        // TODO: Handle limits at the start of a row
        case "limits":
            throw new Error("Unexpected 'limits' token");
        case "row":
            throw new Error("Unexpected 'row' token");
        default:
            throw new UnreachableCaseError(node);
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

const parseNaryInfix =
    (op: NAryOperator) =>
    (parser: EditorParser, left: Parser.types.Node): Parser.types.Node => {
        const [right, ...rest] = parseNaryArgs(parser, op);
        const loc = locFromRange(
            left.loc,
            rest.length > 0 ? rest[rest.length - 1].loc : right.loc,
        );

        switch (op) {
            case "add":
            case "sub":
            case "plusminus":
                return Parser.builders.add([left, right, ...rest], loc);
            case "mul.imp":
                return Parser.builders.mul([left, right, ...rest], true, loc);
            case "mul.exp":
                return Parser.builders.mul([left, right, ...rest], false, loc);
            case "eq":
                return Parser.builders.eq([left, right, ...rest], loc);
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
): OneOrMore<Parser.types.Node> => {
    // TODO: handle implicit multiplication
    const node = parser.peek();
    if (node.type === "token") {
        if (node.name === "identifier" || node.name === "number") {
            // implicit multiplication
        } else {
            // an explicit operation, e.g. plus, times, etc.
            parser.consume();
        }
        let expr = parser.parseWithOperator(op);
        if (op === "sub") {
            const loc = locFromRange(node.loc, expr.loc);
            expr = Parser.builders.neg(expr, true, loc);
        }
        if (op === "plusminus") {
            const loc = locFromRange(node.loc, expr.loc);
            expr = Parser.builders.plusminus(expr, "binary", loc);
        }
        const nextToken = parser.peek();
        if (nextToken.type !== "token") {
            throw new Error("atom expected");
        }
        if (
            (op === "add" || op === "sub" || op === "plusminus") &&
            (nextToken.name === "plus" ||
                nextToken.name === "minus" ||
                nextToken.name === "plusminus")
        ) {
            if (nextToken.name === "plus") {
                op = "add";
            } else if (nextToken.name === "minus") {
                op = "sub";
            } else if (nextToken.name === "plusminus") {
                op = "plusminus";
            } else {
                throw new Error("unexpected value for nextAtom.kind");
            }
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "mul.exp" && nextToken.name === "times") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "mul.imp" && nextToken.name === "identifier") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else if (op === "eq" && nextToken.name === "eq") {
            return [expr, ...parseNaryArgs(parser, op)];
        } else {
            return [expr];
            // TODO: deal with frac, subsup, etc.
        }
    } else if (node.type === "root") {
        parser.consume();
        const [index, radicand] = node.children;
        const expr =
            index === null
                ? Parser.builders.sqrt(
                      editorParser.parse(radicand.children),
                      node.loc,
                  )
                : Parser.builders.root(
                      editorParser.parse(radicand.children),
                      editorParser.parse(index.children),
                      node.loc,
                  );
        const nextToken = parser.peek();
        if (nextToken.type === "root" || isIdentifier(nextToken)) {
            return [expr, ...parseNaryArgs(parser, "mul.imp")];
        } else {
            return [expr];
        }
    } else if (node.type === "frac") {
        parser.consume();
        const [num, den] = node.children;
        const expr = Parser.builders.div(
            editorParser.parse(num.children),
            editorParser.parse(den.children),
            node.loc,
        );
        return [expr];
    } else if (node.type === "delimited") {
        parser.consume();
        const [inner] = node.children;
        // TODO: make 'eol' its own token type instead of a co-opting 'atom'
        const nextToken = parser.peek();
        const expr = Parser.builders.parens(editorParser.parse(inner.children));

        return nextToken.type === "delimited"
            ? [expr, ...parseNaryArgs(parser, op)]
            : [expr];
    } else {
        throw new Error(`we don't handle ${node.type} tokens yet`);
        // TODO: deal with frac, subsup, etc.
    }
};

const getInfixParselet = (
    node: TokenNode,
): Parser.InfixParselet<TokenNode, Parser.types.Node, Operator> | null => {
    switch (node.type) {
        case "token": {
            switch (node.name) {
                case "plus":
                    return {op: "add", parse: parseNaryInfix("add")};
                case "minus":
                    return {op: "add", parse: parseNaryInfix("sub")};
                case "plusminus":
                    return {
                        op: "plusminus",
                        parse: parseNaryInfix("plusminus"),
                    };
                case "times":
                    return {op: "mul.exp", parse: parseNaryInfix("mul.exp")};
                case "eq":
                    return {op: "eq", parse: parseNaryInfix("eq")};
                case "identifier":
                    return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
                case "number":
                    return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
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
                parse: (parser: EditorParser, left: Parser.types.Node) => {
                    parser.consume(); // consume the subsup
                    const [sub, sup] = node.children;

                    if (left.type === "Identifier") {
                        if (sub) {
                            left = {
                                ...left,
                                subscript: editorParser.parse(sub.children),
                            };
                        }
                    } else {
                        if (sub) {
                            throw new Error(
                                "subscripts are only allowed on identifiers",
                            );
                        }
                    }

                    if (sup) {
                        const loc = locFromRange(
                            left.loc,
                            left.loc,
                        ) as Mutable<SourceLocation>;
                        if (loc) {
                            // Add 1 to account for the subsup itself since left
                            // is the node the supsub is being applied to
                            loc.end += 1;
                        }

                        return Parser.builders.pow(
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
                parse: (parser, left): Parser.types.Node => {
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
        case "delimited": {
            return {
                // TODO: figure out how to return a different value for 'op' if
                // the delimited node stands for something else like function
                // arguments.
                op: "mul.imp",
                parse: (parser, left): Parser.types.Node => {
                    const parselet = parseNaryInfix("mul.imp");
                    // TODO: check the left.type can be implicitly multiplied
                    // with parens.
                    return parselet(parser, left);
                },
            };
        }
        case "table":
            throw new Error("We don't handle 'table' tokens yet");
        case "limits":
            throw new Error(`Unexpected 'limits' token`);
        case "row":
            throw new Error(`Unexpected 'row' token`);
        default:
            throw new UnreachableCaseError(node);
    }
};

const getOpPrecedence = (op: Operator): number => {
    switch (op) {
        case "nul":
            return 0;
        case "eq":
            return 2;
        case "add":
        case "sub":
        case "plusminus":
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

const EOL: TokenNode = Lexer.atom(
    {type: "token", name: "eol"},
    Lexer.location([], -1, -1),
);

export const editorParser = Parser.parserFactory<
    TokenNode,
    Parser.types.Node,
    Operator
>(getPrefixParselet, getInfixParselet, getOpPrecedence, EOL);

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
            if (node.type === "Parens") {
                const {arg} = node;
                if (parent.type === "Parens") {
                    return;
                }
                if (parent.type === "mul" && parent.implicit) {
                    return arg;
                }
                if (arg.type === "Identifier" || arg.type === "number") {
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

export const parse = (input: CharRow): Semantic.types.Node => {
    const tokenRow = Lexer.lexRow(input);
    // The Semantic types have more restrictions on where certain node types can appear.
    // We cast for now, but really we should have function that checks that the result of
    // editorParser.parse() follows those restrictions.
    const result = editorParser.parse(tokenRow.children) as Semantic.types.Node;

    return removeExcessParens(result);
};
