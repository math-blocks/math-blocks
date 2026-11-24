// Local oxlint JS plugin for rules oxlint doesn't have natively. It's loaded
// through `jsPlugins` in .oxlintrc.json.

/**
 * A syntax-only port of eslint-plugin-functional's `prefer-readonly-type`
 * with `allowLocalMutation: true` and `allowMutableReturnType: true`, which
 * the repo used with ESLint. oxlint has no native rule for this, and
 * eslint-plugin-functional doesn't load with TypeScript 7 (see #854).
 *
 * It reports array and tuple types, `Array`, `Map` and `Set`, and property,
 * index signature, mapped type, class property and parameter property
 * declarations that aren't `readonly`. Types inside a function body (local
 * mutation) and in a function's return type are allowed.
 */
const preferReadonlyType = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require readonly array, tuple, collection, property and index signature types.',
    },
    messages: {
      array: 'Only readonly arrays allowed.',
      tuple: 'Only readonly tuples allowed.',
      collection: 'Use {{readonly}} instead of {{mutable}}.',
      property: 'A readonly modifier is required.',
    },
    schema: [],
  },
  create(context) {
    /** @param {any} node @param {string} messageId @param {object} [data] */
    const report = (node, messageId, data) => {
      if (!isAllowed(node)) context.report({ node, messageId, data });
    };
    return {
      TSArrayType(node) {
        if (!isReadonlyOperand(node)) report(node, 'array');
      },
      TSTupleType(node) {
        if (!isReadonlyOperand(node)) report(node, 'tuple');
      },
      TSTypeReference(node) {
        const name =
          node.typeName.type === 'Identifier' ? node.typeName.name : null;
        if (name !== null && Object.hasOwn(READONLY_COLLECTIONS, name)) {
          report(node, 'collection', {
            mutable: name,
            readonly: READONLY_COLLECTIONS[name],
          });
        }
      },
      TSPropertySignature(node) {
        if (!node.readonly) report(node, 'property');
      },
      TSIndexSignature(node) {
        if (!node.readonly) report(node, 'property');
      },
      TSMappedType(node) {
        if (node.readonly === null || node.readonly === '-') {
          report(node, 'property');
        }
      },
      PropertyDefinition(node) {
        if (!node.readonly) report(node, 'property');
      },
      TSParameterProperty(node) {
        if (!node.readonly) report(node, 'property');
      },
    };
  },
};

/** @type {Readonly<Record<string, string>>} */
const READONLY_COLLECTIONS = {
  Array: 'ReadonlyArray',
  Map: 'ReadonlyMap',
  Set: 'ReadonlySet',
};

const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'TSCallSignatureDeclaration',
  'TSConstructSignatureDeclaration',
  'TSConstructorType',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression',
  'TSFunctionType',
  'TSMethodSignature',
]);

/**
 * Whether the node is inside a function body (`allowLocalMutation`) or a
 * function's return type (`allowMutableReturnType`). Parameter types aren't
 * local, so they're still checked.
 *
 * @param {any} node
 * @returns {boolean}
 */
const isAllowed = (node) => {
  let child = node;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      FUNCTION_TYPES.has(parent.type) &&
      (parent.body === child || parent.returnType === child)
    ) {
      return true;
    }
    child = parent;
  }
  return false;
};

/**
 * @param {any} node
 * @returns {boolean}
 */
const isReadonlyOperand = (node) =>
  node.parent?.type === 'TSTypeOperator' && node.parent.operator === 'readonly';

export default {
  meta: { name: 'math-blocks' },
  rules: { 'prefer-readonly-type': preferReadonlyType },
};
