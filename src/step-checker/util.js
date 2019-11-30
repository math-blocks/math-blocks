// @flow

const isInteger = (n: number) => parseInt(n) === parseFloat(n);

// TODO: handle negative numbers
export const primeDecomp = (n: number): number[] => {
    if (!isInteger(n)) {
        return [];
    }

    const factors = [];
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
