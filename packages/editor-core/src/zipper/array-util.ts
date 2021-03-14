export const replaceItem = <T>(
    items: readonly T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
};
