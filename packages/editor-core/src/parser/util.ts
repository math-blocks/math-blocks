export function* range(start: number, end: number): Iterable<number> {
    for (let i = start; i < end; i++) {
        yield i;
    }
}

export const zip = <U, V>(
    first: readonly U[],
    second: readonly V[],
): readonly [U, V][] => {
    const len = Math.min(first.length, second.length);
    const result: [U, V][] = [];
    for (let i = 0; i < len; i++) {
        result.push([first[i], second[i]]);
    }
    return result;
};
