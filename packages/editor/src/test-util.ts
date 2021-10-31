import * as Semantic from '@math-blocks/semantic';
import * as types from './char/types';

export const toEqualMath = (
  received: Semantic.types.Node,
  actual: Semantic.types.Node,
): { readonly message: () => string; readonly pass: boolean } => {
  const message = 'Semantic trees did not match';
  if (Semantic.util.deepEquals(received, actual)) {
    return {
      message: () => message,
      pass: true,
    };
  }
  return {
    message: () => message,
    pass: false,
  };
};

// TODO: remove the ids from received and actual and then use the regular
// comparison method
export const toEqualEditorNode = (
  received: types.CharNode,
  actual: types.CharNode,
): { readonly message: () => string; readonly pass: boolean } => {
  const message = 'Semantic trees did not match';
  if (Semantic.util.deepEquals(received, actual)) {
    return {
      message: () => message,
      pass: true,
    };
  }
  return {
    message: () => message,
    pass: false,
  };
};
