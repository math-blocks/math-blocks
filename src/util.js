// @flow
export class UnreachableCaseError extends Error {
    constructor(val: empty) {
        super(`Unreachable case: ${val}`);
    }
}
