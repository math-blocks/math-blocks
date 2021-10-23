export const getId = (() => {
  let id = 0;
  return () => id++;
})();

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`);
  }
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
