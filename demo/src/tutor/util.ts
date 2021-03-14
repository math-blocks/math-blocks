export const getPairs = <T>(array: readonly T[]): readonly [T, T][] => {
    if (array.length < 2) {
        return [];
    }

    const result: [T, T][] = [];
    for (let i = 0; i < array.length - 1; i++) {
        result.push([array[i], array[i + 1]]);
    }

    return result;
};
