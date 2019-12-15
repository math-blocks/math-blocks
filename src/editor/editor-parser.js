// @flow
import * as Parser from "../parser.js";
import * as Semantic from "../semantic.js";
import * as Lexer from "./editor-lexer.js";
import * as Editor from "./editor.js";

export type Token = Editor.Node<Lexer.Token>;

// TODO: fill out this list
type Operator =
    | "add"
    | "sub"
    | "mul.exp"
    | "div"
    | "mul.imp"
    | "neg"
    | "eq"
    | "supsub";

type Node = Semantic.Expression;

type EditorParser = Parser.Parser<Token, Node, Operator>;

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

// NOTE: we don't use a default param here since we want individual
// nodes to be created for the index of each root.
const root = (radicand: Node, index?: Node): Semantic.Root => ({
    type: "root",
    args: [radicand, index || number("2")],
});

const isIdentifier = (node: Token): boolean %checks =>
    node.type === "atom" && node.value.kind === "identifier";

const getPrefixParselet = (
    token: Token,
): ?Parser.PrefixParselet<Token, Node, Operator> => {
    switch (token.type) {
        case "atom": {
            const atom = token.value;
            switch (atom.kind) {
                case "identifier":
                    return {
                        parse: () => identifier(atom.name),
                    };
                case "number":
                    return {
                        parse: () => number(atom.value),
                    };
                case "minus":
                    return {
                        parse: parser =>
                            neg(parser.parseWithOperator("neg"), false),
                    };
                case "ellipsis":
                    return {
                        parse: () => ellipsis(),
                    };
                default:
                    return null;
            }
        }
        case "frac":
            return {
                parse: () => {
                    const [numerator, denominator] = token.children;
                    return div(
                        editorParser.parse(numerator.children),
                        editorParser.parse(denominator.children),
                    );
                },
            };
        case "subsup":
            return null;
        case "row":
            return null;
        case "parens":
            return {
                parse: () => editorParser.parse(token.children),
            };
        case "root":
            return {
                parse: () => {
                    const [arg, index] = token.children;
                    return root(
                        editorParser.parse(arg.children),
                        index ? editorParser.parse(index.children) : undefined,
                    );
                },
            };
        default:
            (token: empty);
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

const parseNaryInfix = (op: Operator) => (
    parser: EditorParser,
    left: Node,
): Node => {
    if (op === "add" || op === "sub") {
        return add([left, ...parseNaryArgs(parser, op)]);
    } else if (op === "mul.imp") {
        return mul([left, ...parseNaryArgs(parser, op)], true);
    } else if (op === "mul.exp") {
        return mul([left, ...parseNaryArgs(parser, op)], false);
    } else {
        return eq([left, ...parseNaryArgs(parser, op)]);
    }
};

const parseNaryArgs = (parser: EditorParser, op: Operator): Node[] => {
    // TODO: handle implicit multiplication
    const token = parser.peek();
    if (token.type === "atom") {
        const atom = token.value;
        if (atom.kind === "identifier") {
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
    } else if (token.type === "parens") {
        parser.consume();
        const expr = editorParser.parse(token.children);
        const nextToken = parser.peek();
        if (nextToken.type === token.type) {
            return [expr, ...parseNaryArgs(parser, "mul.imp")];
        } else {
            return [expr];
        }
    } else if (token.type === "root") {
        parser.consume();
        const [arg, index] = token.children;
        const expr = root(
            editorParser.parse(arg.children),
            index ? editorParser.parse(index.children) : undefined,
        );
        const nextToken = parser.peek();
        if (nextToken.type === "root" || isIdentifier(nextToken)) {
            return [expr, ...parseNaryArgs(parser, "mul.imp")];
        } else {
            return [expr];
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
                parse: (parser: EditorParser, left: Node) => {
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
                        return exp(left, editorParser.parse(sup.children));
                    }

                    return left;
                },
            };
        }
        case "parens": {
            // TODO: handle function application, e.g. f(x)
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
        }
        case "root": {
            return {op: "mul.imp", parse: parseNaryInfix("mul.imp")};
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
        case "mul.exp":
            return 5;
        case "div":
            return 6;
        case "mul.imp":
            return 7;
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

const editorParser = Parser.parserFactory<Token, Node, Operator>(
    getPrefixParselet,
    getInfixParselet,
    getOpPrecedence,
    EOL,
);

export default editorParser;
