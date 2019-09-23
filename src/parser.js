// @flow
/**
 * Generic Pratt (Top-Down Operator Precedence) parser.
 */

export type Token<T> =
    | {|
          type: T,
          value: string,
      |}
    | {|
          type: "eol",
          value: "",
      |};

type InfixParselet<T, N, O> = {|
    op: O,
    parse: (Parser<T, N, O>, N) => N,
|};

type PrefixParselet<T, N, O> = {|
    parse: (Parser<T, N, O>, Token<T>) => N,
|};

export type InfixParseletMap<T, N, O> = {
    [T]: InfixParselet<T, N, O>,
    eol?: InfixParselet<T, N, O>,
};
export type PrefixParseletMap<T, N, O> = {
    [T]: PrefixParselet<T, N, O>,
    eol?: PrefixParselet<T, N, O>,
};

export class Parser<T, N, O> {
    index: number;
    tokens: Array<Token<T>>;
    infixParseletMap: InfixParseletMap<T, N, O>;
    prefixParseletMap: PrefixParseletMap<T, N, O>;
    getOpPrecedence: O => number;

    constructor(
        infixParseletMap: InfixParseletMap<T, N, O>,
        prefixParseletMap: PrefixParseletMap<T, N, O>,
        getOpPrecedence: O => number,
    ) {
        this.infixParseletMap = infixParseletMap;
        this.prefixParseletMap = prefixParseletMap;
        this.getOpPrecedence = getOpPrecedence;
    }

    // returns the next token but does not consume
    peek(): Token<T> {
        const EOL = {type: "eol", value: ""};
        return this.tokens[this.index] || EOL;
    }

    consume(): Token<T> {
        const EOL = {type: "eol", value: ""};
        return this.index < this.tokens.length
            ? this.tokens[this.index++]
            : EOL;
    }

    getPrecedence() {
        const token = this.peek();
        const parselet = this.infixParseletMap[token.type];
        if (parselet) {
            return this.getOpPrecedence(parselet.op);
        }
        return 0;
    }

    parseInfix(left: N): N {
        const token = this.peek();
        const parselet = this.infixParseletMap[token.type];
        return parselet ? parselet.parse(this, left) : left;
    }

    parsePrefix(): N {
        const token = this.consume();
        const parselet = this.prefixParseletMap[token.type];
        if (!parselet) {
            throw new Error("Unexpected token");
        }
        return parselet.parse(this, token);
    }

    parseWithPrecedence(precedence: number): N {
        let left: N = this.parsePrefix();
        while (precedence < this.getPrecedence()) {
            left = this.parseInfix(left);
        }
        return left;
    }

    parse(tokens: Array<Token<T>>) {
        this.tokens = tokens;
        this.index = 0;
        return this.parseWithPrecedence(0);
    }
}
