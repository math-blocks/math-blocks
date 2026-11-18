import builders from '../builders';
import { NodeType } from '../enums';

const a = builders.identifier('a');
const b = builders.identifier('b');

describe('NodeType', () => {
  test.each([
    ['PlusMinus', NodeType.PlusMinus, builders.plusminus([a, b])],
    ['MinusPlus', NodeType.MinusPlus, builders.minusplus([a, b])],
    ['Vector', NodeType.Vector, builders.vector([a, b], 2)],
    ['Matrix', NodeType.Matrix, builders.matrix([a, b], 1, 2)],
  ])(
    'NodeType.%s matches the type of the node its builder creates',
    (_, type, node) => {
      expect(node.type).toBe(type);
    },
  );
});
