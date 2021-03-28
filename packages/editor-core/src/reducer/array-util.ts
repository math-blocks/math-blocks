export const replaceItem = <T>(
    items: readonly T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
};

export const insertBeforeIndex = <T>(
    items: readonly T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index)];
};

export const insertAfterIndex = <T>(
    items: readonly T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
};

export const deleteIndex = <T>(
    items: readonly T[] | TwoOrMore<T>,
    index: number,
): T[] => {
    return items.filter((_, i) => index !== i);
};
