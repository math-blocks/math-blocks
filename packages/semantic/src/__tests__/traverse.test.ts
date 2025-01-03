import { traverse } from '../util';
import * as types from '../types';
import { NodeType } from '../enums';

describe('traverse', () => {
  it('call enter and exit once for a single node', () => {
    const num: types.Number = {
      id: 0,
      type: NodeType.Number,
      value: '123',
    };
    const enter = jest.fn();
    const exit = jest.fn();

    traverse(num, { enter, exit });

    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledWith(num);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(num);
  });

  it('should traverse arrays', () => {
    const add: types.Add = {
      id: 0,
      type: NodeType.Add,
      args: [
        {
          id: 1,
          type: NodeType.Number,
          value: '123',
        },
        {
          id: 2,
          type: NodeType.Number,
          value: '456',
        },
      ],
    };
    const enter = jest.fn();

    traverse(add, { enter });

    expect(enter).toHaveBeenCalledTimes(3);
    expect(enter).toHaveBeenCalledWith(add);
    expect(enter).toHaveBeenCalledWith(add.args[0]);
    expect(enter).toHaveBeenCalledWith(add.args[1]);
  });

  it('call traverse properties', () => {
    const power: types.Pow = {
      id: 0,
      type: NodeType.Power,
      base: {
        id: 1,
        type: NodeType.Identifier,
        name: 'x',
      },
      exp: {
        id: 2,
        type: NodeType.Number,
        value: '3',
      },
    };
    const enter = jest.fn();

    traverse(power, { enter });

    expect(enter).toHaveBeenCalledTimes(3);
    expect(enter).toHaveBeenCalledWith(power);
    expect(enter).toHaveBeenCalledWith(power.base);
    expect(enter).toHaveBeenCalledWith(power.exp);
  });

  it('should not call cb on location', () => {
    const num: types.Number = {
      id: 0,
      type: NodeType.Number,
      value: '123',
      loc: {
        path: [],
        start: 1,
        end: 2,
      },
    };
    const enter = jest.fn();

    traverse(num, { enter });

    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledWith(num);
  });

  it('supports making changes to a node on exit', () => {
    const power: types.Pow = {
      id: 0,
      type: NodeType.Power,
      base: {
        id: 1,
        type: NodeType.Identifier,
        name: 'x',
      },
      exp: {
        id: 2,
        type: NodeType.Number,
        value: '3',
      },
    };

    const result = traverse(power, {
      exit: (node) => {
        if (node.type === NodeType.Identifier && node.name === 'x') {
          return {
            ...node,
            name: 'y',
          };
        }
      },
    });

    expect(result).toEqual({
      id: 0,
      type: NodeType.Power,
      base: {
        id: 1,
        type: NodeType.Identifier,
        name: 'y',
      },
      exp: {
        id: 2,
        type: NodeType.Number,
        value: '3',
      },
    });
  });

  it('supports making changes to an element in an array on exit', () => {
    const sum: types.Add = {
      id: 0,
      type: NodeType.Add,
      args: [
        {
          id: 1,
          type: NodeType.Identifier,
          name: 'x',
        },
        {
          id: 2,
          type: NodeType.Number,
          value: '3',
        },
      ],
    };

    const result = traverse(sum, {
      exit: (node) => {
        if (node.type === NodeType.Identifier && node.name === 'x') {
          return {
            ...node,
            name: 'y',
          };
        }
      },
    });

    expect(result).toEqual({
      id: 0,
      type: NodeType.Add,
      args: [
        {
          id: 1,
          type: NodeType.Identifier,
          name: 'y',
        },
        {
          id: 2,
          type: NodeType.Number,
          value: '3',
        },
      ],
    });
  });

  it('should not mutate the original node', () => {
    const sum: types.Add = {
      id: 0,
      type: NodeType.Add,
      args: [
        {
          id: 1,
          type: NodeType.Identifier,
          name: 'x',
        },
        {
          id: 2,
          type: NodeType.Number,
          value: '3',
        },
      ],
    };

    traverse(sum, {
      exit: (node) => {
        if (node.type === NodeType.Identifier && node.name === 'x') {
          return {
            ...node,
            name: 'y',
          };
        }
      },
    });

    // @ts-expect-error: we know sum.args[0] is an Identifier
    expect(sum.args[0].name).toEqual('x');
  });
});
