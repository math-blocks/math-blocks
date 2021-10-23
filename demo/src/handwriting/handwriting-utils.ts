export type Point = {
  readonly x: number;
  readonly y: number;
};

export const distance = (a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const len = (p: Point): number => Math.sqrt(p.x * p.x + p.y * p.y);

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min);
