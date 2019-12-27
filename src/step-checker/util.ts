import * as Arithmetic from "./arithmetic";
import * as Semantic from "../semantic/semantic";

// TODO: handle negative numbers
export const primeDecomp = (n: number): number[] => {
    if (!Number.isInteger(n)) {
        return [];
    }

    const factors: number[] = [];
    let p = 2;
    while (n >= p * p) {
        if (n % p === 0) {
            factors.push(p);
            n = n / p;
        } else {
            p = p + 1;
        }
    }
    factors.push(n);

    return factors;
};

export const zip = <A, B>(
    a: readonly A[],
    b: readonly B[],
): readonly (readonly [A, B])[] =>
    a.length < b.length
        ? a.map((aItem, index) => [aItem, b[index]])
        : b.map((bItem, index) => [a[index], bItem]);

export const decomposeFactors = (
    factors: readonly Semantic.Expression[],
): Semantic.Expression[] => {
    return factors.reduce((result: Semantic.Expression[], factor) => {
        // TODO: add decomposition of powers
        if (factor.type === "number") {
            return [
                ...result,
                ...primeDecomp(parseInt(factor.value)).map(Arithmetic.num),
            ];
        } else {
            return [...result, factor];
        }
    }, []);
};
