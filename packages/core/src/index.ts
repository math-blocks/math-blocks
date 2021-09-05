export const __private = {
    id: 0,
};

export const getId = (() => {
    return () => __private.id++;
})();

export class UnreachableCaseError extends Error {
    constructor(val: never) {
        super(`Unreachable case: ${val}`);
    }
}
