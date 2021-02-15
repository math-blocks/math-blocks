export const replaceItem = <T>(
    items: T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
};

export const splitArrayAt = <T>(items: T[], index: number): [T[], T[]] => {
    return [items.slice(0, index), items.slice(index)];
};
