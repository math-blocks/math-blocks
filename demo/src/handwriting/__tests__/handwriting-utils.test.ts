// TODO: split this into point.ts and number.ts (add lerp as well)
import { distance, len, clamp } from '../handwriting-utils';

describe('distance', () => {
  it('should return 0 if passed the same point', () => {
    const p = { x: 5, y: 10 };
    expect(distance(p, p)).toEqual(0);
  });

  it('distance(origin, p) is the same as len(p)', () => {
    const origin = { x: 0, y: 0 };
    const p = { x: 5, y: 10 };
    expect(distance(origin, p)).toEqual(len(p));
  });
});

describe('len', () => {
  it('should return 0 for the origin', () => {
    const origin = { x: 0, y: 0 };
    expect(len(origin)).toEqual(0);
  });

  it('should return 5 for the standard x:3, y:4', () => {
    expect(len({ x: 3, y: 4 })).toEqual(5);
  });

  it('should not be affected by orientation', () => {
    expect(len({ x: 3, y: -4 })).toEqual(5);
    expect(len({ x: -3, y: -4 })).toEqual(5);
    expect(len({ x: 4, y: 3 })).toEqual(5);
    expect(len({ x: 4, y: -3 })).toEqual(5);
  });
});

describe('clamp', () => {
  it('should not change the value within the stated range', () => {
    expect(clamp(5, 0, 10)).toEqual(5);
  });

  it('should clamp large numbers to the top of the range', () => {
    expect(clamp(100, 0, 10)).toEqual(10);
  });

  it('should clamp small numbers to the bottom of the range', () => {
    expect(clamp(-100, 0, 10)).toEqual(0);
  });

  it('should work with infinities', () => {
    expect(clamp(Infinity, 0, 10)).toEqual(10);
    expect(clamp(-Infinity, 0, 10)).toEqual(0);
    expect(clamp(Infinity, 0, Infinity)).toEqual(Infinity);
    expect(clamp(-Infinity, -Infinity, 10)).toEqual(-Infinity);
  });
});
