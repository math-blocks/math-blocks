// @flow
/**
 * Generic Pratt (Top-Down Operator Precedence) parser.
 *
 * Generic parameters used in this file:
 * - T: Token
 * - N: Node
 * - O: Operator
 */

export class Parser<T: {+type: string}, N, O> {
    // Machinery
    index: number;
    tokens: Array<T>;

    // Configration
    EOL: T;
    infixParseletMap: InfixParseletMap<T, N, O>;
    prefixParseletMap: PrefixParseletMap<T, N, O>;
    getOpPrecedence: O => number;

    constructor(
        infixParseletMap: InfixParseletMap<T, N, O>,
        prefixParseletMap: PrefixParseletMap<T, N, O>,
        getOpPrecedence: O => number,
        EOL: T,
    ) {
        this.infixParseletMap = infixParseletMap;
        this.prefixParseletMap = prefixParseletMap;
        this.getOpPrecedence = getOpPrecedence;
        this.EOL = EOL;
    }

    // returns the next token but does not consume
    peek(): T {
        return this.tokens[this.index] || this.EOL;
    }

    consume(): T {
        return this.index < this.tokens.length
            ? this.tokens[this.index++]
            : this.EOL;
    }

    getPrecedence() {
        const token = this.peek();
        const parselet = this.infixParseletMap[token.type];
        return parselet ? this.getOpPrecedence(parselet.op) : 0;
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

    parse(tokens: Array<T>) {
        this.tokens = tokens;
        this.index = 0;
        return this.parseWithPrecedence(0);
    }
}

type InfixParselet<T, N, O> = {|
    op: O,
    parse: (Parser<T, N, O>, N) => N,
|};

type PrefixParselet<T, N, O> = {|
    parse: (Parser<T, N, O>, T) => N,
|};

export type InfixParseletMap<T, N, O> = {
    [$PropertyType<T, "type">]: InfixParselet<T, N, O>,
};

export type PrefixParseletMap<T, N, O> = {
    [$PropertyType<T, "type">]: PrefixParselet<T, N, O>,
};
