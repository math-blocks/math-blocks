// @flow
/**
 * Generic Pratt (Top-Down Operator Precedence) parser.
 *
 * Generic parameters used in this file:
 * - T: Token
 * - N: Node
 * - O: Operator
 */

export interface Parser<T, N, O> {
    +parseWithOperator: (op: O, associativity?: Associativity) => N;
    +peek: () => T;
    +consume: () => T;
    +parse: () => N;
}

type Associativity = "right" | "left";

export function parserFactory<T: {+type: string, ...}, N, O>(
    getPrefixParselet: (token: T) => ?PrefixParselet<T, N, O>,
    getInfixParselet: (token: T) => ?InfixParselet<T, N, O>,
    getOpPrecedence: O => number,
    EOL: T,
): {parse: (Array<T>) => N} {
    // rewrite this as a class.
    const parse = (tokens: Array<T>): N => {
        let index: number = 0;

        // returns the next token but does not consume
        const peek = (): T => {
            return tokens[index] || EOL;
        };

        const consume = (): T => {
            return index < tokens.length ? tokens[index++] : EOL;
        };

        const getPrecedence = (
            associativity: Associativity = "left",
        ): number => {
            const token = peek();
            const parselet = getInfixParselet(token);
            if (parselet) {
                const precedence = getOpPrecedence(parselet.op);
                return associativity === "left" ? precedence : precedence + 1;
            }
            return 0;
        };

        const parseInfix = (left: N): N => {
            const token = peek();
            const parselet = getInfixParselet(token);
            return parselet
                ? parselet.parse(
                      {
                          parse: () => parseWithPrecedence(0),
                          parseWithOperator,
                          peek,
                          consume,
                      },
                      left,
                  )
                : left;
        };

        const parsePrefix = (): N => {
            const token = consume();
            // TODO: combine getPrefixParselet and parselet.parse
            const parselet = getPrefixParselet(token);
            if (!parselet) {
                console.log(token);
                throw new Error("Unexpected token");
            }
            return parselet.parse({
                parse: () => parseWithPrecedence(0),
                parseWithOperator,
                peek,
                consume,
            });
        };

        const parseWithPrecedence = (
            precedence: number,
            associativity: Associativity = "left",
        ): N => {
            let left: N = parsePrefix();
            while (precedence < getPrecedence(associativity)) {
                left = parseInfix(left);
            }
            return left;
        };

        const parseWithOperator = (
            op: O,
            associativity: Associativity = "left",
        ): N => {
            return parseWithPrecedence(getOpPrecedence(op), associativity);
        };

        const result = parseWithPrecedence(0);
        const lastToken = peek();
        if (lastToken !== EOL) {
            if (lastToken.type === "rparen") {
                throw new Error("unmatched right paren");
            }
            throw new Error("unexpected token");
        }
        return result;
    };
    return {parse};
}

export type InfixParselet<T, N, O> = {
    op: O,
    parse: (Parser<T, N, O>, N) => N,
};

export type PrefixParselet<T, N, O> = {
    parse: (Parser<T, N, O>) => N,
};
