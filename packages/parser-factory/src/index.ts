/**
 * Generic Pratt (Top-Down Operator Precedence) parser.
 *
 * Generic parameters used in this file:
 * - T: Token
 * - N: Node
 * - O: Operator
 */
import * as Util from "./util";
import * as Types from "./types";

export {Util, Types};

export interface IParser<T, N, O> {
    readonly parseWithOperator: (op: O, associativity?: Associativity) => N;
    readonly peek: () => T;
    readonly consume: () => T;
    readonly parse: () => N;
}

type Associativity = "right" | "left";

export function parserFactory<T extends {readonly type: string}, N, O>(
    getPrefixParselet: (token: T) => PrefixParselet<T, N, O>,
    getInfixParselet: (token: T) => InfixParselet<T, N, O> | null,
    getOpPrecedence: (arg0: O) => number,
    EOL: T,
): {parse: (arg0: readonly T[]) => N} {
    // rewrite this as a class.
    const parse = (tokens: readonly T[]): N => {
        let index = 0;

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
    op: O;
    parse: (arg0: IParser<T, N, O>, arg1: N) => N;
};

export type PrefixParselet<T, N, O> = {
    parse: (arg0: IParser<T, N, O>) => N;
};
