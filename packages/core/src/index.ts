export const getId = (() => {
    let id = 0;
    return () => id++;
})();

export class UnreachableCaseError extends Error {
    constructor(val: never) {
        super(`Unreachable case: ${val}`);
    }
}
