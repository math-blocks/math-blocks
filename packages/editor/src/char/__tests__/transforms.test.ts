import { traverseNode, applyColorMapToEditorNode } from '../transforms';
import * as builders from '../builders';
import * as types from '../types';

describe('transformNode', () => {
  describe('returns the same node if the callback is a passthrough', () => {
    test('simple row', () => {
      const node = builders.row([
        builders.char('x'),
        builders.char('+'),
        builders.char('y'),
      ]);

      const result = traverseNode(
        node,
        {
          exit: (node) => node,
        },
        [],
      );

      expect(result).toBe(node);
    });

    test('fraction', () => {
      const node = builders.frac([builders.char('x')], [builders.char('y')]);

      const result = traverseNode(
        node,
        {
          exit: (node) => node,
        },
        [],
      );

      expect(result).toBe(node);
    });
  });

  describe('setting the color on every node only changes .style.color', () => {
    const setColor = <T extends types.CharNode>(node: T, color: string): T => {
      return {
        ...node,
        style: {
          ...node.style,
          color: 'blue',
        },
      };
    };

    test('simple row', () => {
      const node = builders.row([
        builders.char('x'),
        builders.char('+'),
        builders.char('y'),
      ]);

      const result = traverseNode(
        node,
        {
          exit: (node) => setColor(node, 'blue'),
        },
        [],
      );

      expect(result).not.toBe(node);
      // @ts-expect-error: ignore readonly
      node.style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[0].style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[1].style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[2].style.color = 'blue';
      expect(result).toEqual(node);
    });

    test('fraction', () => {
      const node = builders.frac([builders.char('x')], [builders.char('y')]);

      const result = traverseNode(
        node,
        {
          exit: (node) => setColor(node, 'blue'),
        },
        [],
      );

      expect(result).not.toBe(node);
      // @ts-expect-error: ignore readonly
      node.style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[0].style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[1].style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[0].children[0].style.color = 'blue';
      // @ts-expect-error: ignore readonly
      node.children[1].children[0].style.color = 'blue';
      expect(result).toEqual(node);
    });
  });
});

describe('applyColorMapToEditorNode', () => {
  test('simple row', () => {
    const node = builders.row([
      builders.char('x'),
      builders.char('+'),
      builders.char('y'),
    ]);

    const colorMap = new Map();
    colorMap.set(node.children[2].id, 'blue');

    const result = applyColorMapToEditorNode(node, colorMap);

    expect(result).not.toBe(node);
    // @ts-expect-error: ignore readonly
    node.children[2].style.color = 'blue';
    expect(result).toEqual(node);
  });

  test('fraction', () => {
    const node = builders.frac([builders.char('x')], [builders.char('y')]);

    const colorMap = new Map();
    colorMap.set(node.children[1].children[0].id, 'blue');

    const result = applyColorMapToEditorNode(node, colorMap);

    expect(result).not.toBe(node);
    // @ts-expect-error: ignore readonly
    node.children[1].children[0].style.color = 'blue';
    expect(result).toEqual(node);
  });
});
