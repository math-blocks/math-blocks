import { traverse, traverseNumeric } from '../util';
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

describe('traverseNumeric', () => {
  const x: types.Identifier = { id: 1, type: NodeType.Identifier, name: 'x' };
  const three: types.Number = { id: 2, type: NodeType.Number, value: '3' };
  const sum: types.Add = { id: 0, type: NodeType.Add, args: [x, three] };

  it('visits every node, entering parents before children', () => {
    const entered: types.Node[] = [];
    const exited: types.Node[] = [];

    traverseNumeric(sum, {
      enter: (node) => entered.push(node),
      exit: (node) => {
        exited.push(node);
      },
    });

    expect(entered.map((node) => node.id)).toEqual([0, 1, 2]);
    expect(exited.map((node) => node.id)).toEqual([1, 2, 0]);
  });

  it('visits nodes stored in non-array properties', () => {
    const pow: types.Pow = { id: 3, type: NodeType.Power, base: x, exp: three };
    const enter = jest.fn();

    traverseNumeric(pow, { enter });

    expect(enter).toHaveBeenCalledTimes(3);
    expect(enter).toHaveBeenCalledWith(x);
    expect(enter).toHaveBeenCalledWith(three);
  });

  it('works without any callbacks', () => {
    expect(traverseNumeric(sum, {})).toEqual(sum);
  });

  it('replaces nodes with the value returned from exit', () => {
    const result = traverseNumeric(sum, {
      exit: (node) => {
        if (node.type === NodeType.Identifier) {
          return { ...node, name: 'y' };
        }
      },
    });

    expect(result).toEqual({
      ...sum,
      args: [{ ...x, name: 'y' }, three],
    });
    expect(x.name).toEqual('x');
  });

  it('can replace the root node', () => {
    const result = traverseNumeric(sum, {
      exit: (node) => (node.type === NodeType.Add ? three : undefined),
    });

    expect(result).toBe(three);
  });
});
