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
    +parseWithOperator: (op: O) => N;
    +peek: () => T;
    +consume: () => T;
    +parse: (Array<T>) => N;
}

export function parserFactory<T: {+type: string, ...}, N, O>(
    getPrefixParselet: (token: T) => ?PrefixParselet<T, N, O>,
    getInfixParselet: (token: T) => ?InfixParselet<T, N, O>,
    getOpPrecedence: O => number,
    EOL: T,
): {parse: (Array<T>) => N} {
    const parse = (tokens: Array<T>): N => {
        let index: number = 0;

        // returns the next token but does not consume
        const peek = (): T => {
            return tokens[index] || EOL;
        };

        const consume = (): T => {
            return index < tokens.length ? tokens[index++] : EOL;
        };

        const getPrecedence = (): number => {
            const token = peek();
            const parselet = getInfixParselet(token);
            return parselet ? getOpPrecedence(parselet.op) : 0;
        };

        const parseInfix = (left: N): N => {
            const token = peek();
            const parselet = getInfixParselet(token);
            return parselet
                ? parselet.parse(
                      {parse, parseWithOperator, peek, consume},
                      left,
                  )
                : left;
        };

        const parsePrefix = (): N => {
            const token = consume();
            // TODO: combine getPrefixParselet and parselet.parse
            const parselet = getPrefixParselet(token);
            if (!parselet) {
                throw new Error("Unexpected token");
            }
            return parselet.parse({
                parse,
                parseWithOperator,
                peek,
                consume,
            });
        };

        const parseWithPrecedence = (precedence: number): N => {
            let left: N = parsePrefix();
            while (precedence < getPrecedence()) {
                left = parseInfix(left);
            }
            return left;
        };

        const parseWithOperator = (op: O): N => {
            return parseWithPrecedence(getOpPrecedence(op));
        };

        return parseWithPrecedence(0);
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
