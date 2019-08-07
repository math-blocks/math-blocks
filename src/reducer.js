// @flow
import produce from "immer";

import {type Node, type Row, type HasChildren, findNode_} from "./editor-ast";
import {type EditorCursor} from "./editor";
import {getId} from "./unique-id";

export type State = {
  math: Row,
  cursor: EditorCursor,
};

const root: Row = {
  id: getId(),
  type: "row",
  children: [{
    id: getId(),
    type: "glyph",
    char: "1",
  }, {
    id: getId(),
    type: "glyph",
    char: "+",
  }, {
    id: getId(),
    type: "frac", 
    numerator: {
      id: getId(),
      type: "row",
      children: [{
        id: getId(),
        type: "glyph",
        char: "1",
      }],
    },
    denominator: {
      id: getId(),
      type: "row",
      children: [{
        id: getId(),
        type: "glyph",
        char: "2",
      }, {
        id: getId(),
        type: "glyph",
        char: "y",
      }],
    },
  }, {
    id: getId(),
    type: "glyph",
    char: "\u2212",
  }, {
    id: getId(),
    type: "glyph",
    char: "x",
  }],
};

const initialState: State = {
  math: root,
  cursor: {
    path: [root.id],
    prev: root.children[1].id,
    next: root.children[2].id,
  },
};

const hasChildren = (node: Node): %checks => {
  return node.type === "row" || node.type === "parens";
}

const getChildWithId = <T: $ReadOnly<{id: number}>>(children: $ReadOnlyArray<T>, childId: number): T | void => {
  return children.find(child => child.id === childId);
}

const firstId = <T: $ReadOnly<{id: number}>>(items: $ReadOnlyArray<T>) => {
  return items.length > 0 ? items[0].id : null;
}

const lastId = <T: $ReadOnly<{id: number}>>(items: $ReadOnlyArray<T>) => {
  return items.length > 0 ? items[items.length - 1].id : null;
}

const nextId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index < children.length - 1 ? children[index + 1].id : null;
}

const prevId = (children: Node[], childId: number) => {
  const index = children.findIndex(child => child.id === childId);
  if (index === -1) {
    return null;
  }
  return index > 0 ? children[index - 1].id : null;
}

const removeIndex = <T>(array: T[], index: number): T[] => {
  return [
    ...array.slice(0, index),
    ...array.slice(index + 1),
  ];
};

const removeChildWithId = <T: {id: number}>(children: T[], id: number): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      ...children.slice(index + 1),
    ];
};

const insertBeforeChildWithId = <T: {id: number}>(children: T[], id: number, newChild: T): T[] => {
  const index = children.findIndex(child => child.id === id);
  return index === -1
    ? children
    : [
      ...children.slice(0, index),
      newChild,
      ...children.slice(index),
    ];
}

const moveLeft = (root: Node, currentNode: HasChildren, cursor: EditorCursor): EditorCursor => {
  const {children} = currentNode;
  if (cursor.prev != null) {
    const {prev} = cursor;
    const prevNode = getChildWithId(currentNode.children, cursor.prev);
    if (prevNode && prevNode.type === "frac") {
      // enter fraction (denominator)
      return {
        path: [...cursor.path, prevNode.id, prevNode.denominator.id],
        next: null,
        prev: lastId(prevNode.denominator.children),
      };
    } else if (prevNode && prevNode.type === "subsup") {
      // enter sup/sub
      if (prevNode.sup) {
        return {
          path: [...cursor.path, prevNode.id, prevNode.sup.id],
          next: null,
          prev: lastId(prevNode.sup.children),
        };
      } else if (prevNode.sub) {
        return {
          path: [...cursor.path, prevNode.id, prevNode.sub.id],
          next: null,
          prev: lastId(prevNode.sub.children),
        };
      } else {
        throw new Error("subsup node must have at least a sub or sup");
      }
    } else {
      // move to the left
      return {
        path: cursor.path,
        next: cursor.prev,
        prev: prevId(children, prev),
      };
    }
  } else if (cursor.path.length > 1) {
    const parent = findNode_(root, cursor.path[cursor.path.length - 2])

    if (parent.type === "subsup" && cursor.path.length > 2) {
      const grandparent = findNode_(root, cursor.path[cursor.path.length - 3]);
      const {sub, sup} = parent;
      if (currentNode === sup && hasChildren(grandparent)) {
        if (sub) {
          return {
            path: [...cursor.path.slice(0, -1), sub.id],
            next: null,
            prev: lastId(sub.children),
          };
        } else {
          return {
            path: cursor.path.slice(0, -2),
            next: parent.id,
            prev: prevId(grandparent.children, parent.id),
          };
        }
      } else if (currentNode === sub && hasChildren(grandparent)) {
        return {
          path: cursor.path.slice(0, -2),
          next: parent.id,
          prev: prevId(grandparent.children, parent.id),
        };
      }
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = findNode_(root, cursor.path[cursor.path.length - 3]);

      if (currentNode === parent.denominator) {
        // move from denominator to numerator
        return {
          path: [...cursor.path.slice(0, -1), parent.numerator.id],
          next: null,
          prev: lastId(parent.numerator.children),
        };
      } else if (currentNode === parent.numerator && hasChildren(grandparent)) {
        // exit fraction to the left
        return {
          path: cursor.path.slice(0, -2),
          next: parent.id,
          prev: prevId(grandparent.children, parent.id),
        };
      }
    }
  }
  return cursor;
}

const moveRight = (root: Node, currentNode: HasChildren, cursor: EditorCursor): EditorCursor => {
  const {children} = currentNode;
  if (cursor.next != null) {
    const {next} = cursor;
    const nextNode = getChildWithId(currentNode.children, cursor.next);
    if (nextNode && nextNode.type === "frac") {
      // enter fraction (numerator)
      return {
        path: [...cursor.path, nextNode.id, nextNode.numerator.id],
        prev: null,
        next: firstId(nextNode.numerator.children),
      };
    } else if (nextNode && (nextNode.type === "subsup")) {
      // enter sup/sub
      if (nextNode.sub) {
        return {
          path: [...cursor.path, nextNode.id, nextNode.sub.id],
          prev: null,
          next: firstId(nextNode.sub.children),
        };
      } else if (nextNode.sup) {
        return {
          path: [...cursor.path, nextNode.id, nextNode.sup.id],
          prev: null,
          next: firstId(nextNode.sup.children),
        };
      } else {
        throw new Error("subsup node must have at least a sub or sup");
      }
    } else {
      // move to the right
      return {
        path: cursor.path,
        prev: cursor.next,
        next: nextId(children, next),
      };
    }
  } else if (cursor.path.length > 1) {
    const parent = findNode_(root, cursor.path[cursor.path.length - 2]);

    if ((parent.type === "subsup") && cursor.path.length > 2) {
      const grandparent = findNode_(root, cursor.path[cursor.path.length - 3]);

      if (currentNode === parent.sub && hasChildren(grandparent)) {
        if (parent.sup) {
          const {sup} = parent;
          return {
            path: [...cursor.path.slice(0, -1), sup.id],
            prev: null,
            next: firstId(sup.children),
          };
        } else {
          return {
            path: cursor.path.slice(0, -2),
            prev: parent.id,
            next: nextId(grandparent.children, parent.id),
          };
        }
      } else if (currentNode === parent.sup && hasChildren(grandparent)) {
        return {
          path: cursor.path.slice(0, -2),
          prev: parent.id,
          next: nextId(grandparent.children, parent.id),
        }
      }
    } else if (parent.type === "frac" && cursor.path.length > 2) {
      const grandparent = findNode_(root, cursor.path[cursor.path.length - 3]);

      if (currentNode === parent.numerator) {
        // move from numerator to denominator
        return {
          path: [...cursor.path.slice(0, -1), parent.denominator.id],
          prev: null,
          next: firstId(parent.denominator.children),
        };
      } else if (currentNode === parent.denominator && hasChildren(grandparent)) {
        // exit fraction to the right
        return {
          path: cursor.path.slice(0, -2),
          prev: parent.id,
          next: nextId(grandparent.children, parent.id),
        };
      }
    }
  }
  return cursor;
}


const backspace = (currentNode: Node, draft: State) => {
  if (!hasChildren(currentNode)) {
    throw new Error("currentNode can't be a glyph, fraction, sup, or sub");
  }
  const {cursor} = draft;

  if (cursor.prev != null) {
    const {children} = currentNode;
    const removeId = cursor.prev;
    const newCursor = {
      ...cursor,
      prev: prevId(currentNode.children, cursor.prev),
    };
    currentNode.children = removeChildWithId(children, removeId);
    draft.cursor = newCursor;
    return;
  } else if (cursor.path.length > 1) {
    const parent = findNode_(root, cursor.path[cursor.path.length - 2]);
    const grandparent = findNode_(root, cursor.path[cursor.path.length - 3]);

    if (parent.type === "subsup") {
      if (!hasChildren(grandparent)) {
        return;
      }

      const index = grandparent.children.findIndex(child => child.id === parent.id);
      const newChildren = index === -1
        ? grandparent.children
        // replace currentNode with currentNode's children
        : [
          ...grandparent.children.slice(0, index),
          ...currentNode.children,
          ...grandparent.children.slice(index + 1),
        ];

      // update cursor
      const next = currentNode.children.length > 0
        ? currentNode.children[0].id
        : nextId(grandparent.children, parent.id);
      const prev = next ? prevId(newChildren, next) : firstId(grandparent.children);
      const newCursor = {
        path: cursor.path.slice(0, -2), // move up two levels
        prev, 
        next,
      };

      // update children
      grandparent.children = newChildren;

      draft.cursor = newCursor;
      return;
    }
  }
}

const reducer = (state: State = initialState, action: any) => {
  return produce(state, (draft) => {
    const {cursor} = draft;    
    const currentNode = findNode_(draft.math, cursor.path[cursor.path.length - 1]);

    if (!hasChildren(currentNode)) {
      throw new Error("currentNode can't be a glyph, fraction, sup, or sub");
    }

    const nextNode = cursor.next && hasChildren(currentNode)
      ? currentNode.children.find(child => child.id === cursor.next)
      : null;

    let newNode;
    const {next} = cursor;

    switch (action.type) {
      case "ArrowLeft": {
        draft.cursor = moveLeft(draft.math, currentNode, cursor);
        return;
      }
      case "ArrowRight": {
        draft.cursor = moveRight(draft.math, currentNode, cursor);
        return;
      }
      case "Backspace": {
        backspace(currentNode, draft);
        return;
      }
      case "-": {
        newNode = {
          id: getId(),
          type: "glyph",
          char: "\u2212",
        };
        draft.cursor.prev = newNode.id;
        break;
      }
      case "*": {
        newNode = {
          id: getId(),
          type: "glyph",
          char: "\u00B7",
        };
        draft.cursor.prev = newNode.id;
        break;
      }
      case "/": {
        newNode = {
          id: getId(),
          type: "frac",
          numerator: {
            id: getId(),
            type: "row",
            children: [],
          },
          denominator: {
            id: getId(),
            type: "row",
            children: [],
          },
        }
        break;
      }
      case "^": {
        if (nextNode && nextNode.type === "subsup") {
          if (!nextNode.sup) {
            nextNode.sup = {
              id: getId(),
              type: "row",
              children: [],
            };
          }
          draft.cursor = {
            path: [...cursor.path, nextNode.id, nextNode.sup.id],
            prev: null,
            next: firstId(nextNode.sup.children),
          };
          return;
        }
        newNode = {
          id: getId(),
          type: "subsup",
          sup: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
        break;
      }
      case "_": {
        if (nextNode && nextNode.type === "subsup") {
          if (!nextNode.sub) {
            nextNode.sub = {
              id: getId(),
              type: "row",
              children: [],
            };
          }
          draft.cursor = {
            path: [...cursor.path, nextNode.id, nextNode.sub.id],
            prev: null,
            next: firstId(nextNode.sub.children),
          };
          return;
        }
        newNode = {
          id: getId(),
          type: "subsup",
          sub: {
            id: getId(),
            type: "row",
            children: [],
          },
        };
        break;
      }
      default: {
        if (action.type.length === 1 && action.type.charCodeAt(0) >= 32) {
          newNode = {
            id: getId(),
            type: "glyph",
            char: action.type,
          };
          draft.cursor.prev = newNode.id;
          break;
        }
        return;
      }
    }

    if (next == null) {
      currentNode.children.push(newNode);
    } else {
      currentNode.children = insertBeforeChildWithId(currentNode.children, next, newNode);
    }

    if (newNode.type === "frac") {
      draft.cursor = {
        path: [...cursor.path, newNode.id, newNode.numerator.id],
        next: null,
        prev: null,
      };
    } else if (newNode.type === "subsup") {
      if (newNode.sup) {
        draft.cursor = {
          path: [...cursor.path, newNode.id, newNode.sup.id],
          next: null,
          prev: null,
        };
      } else if (newNode.sub) {
        draft.cursor = {
          path: [...cursor.path, newNode.id, newNode.sub.id],
          next: null,
          prev: null,
        };
      }
    }
  });
};

export default reducer;
