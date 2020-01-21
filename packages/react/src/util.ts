import * as Editor from "@math-blocks/editor";

// The next/prev properties represent node ids instead of indices.
// This simplifies the rendering of the cursor/selection.  This is
// because layouts have more nodes than what appears in the editor
// AST.
type LayoutCursor = {
    parent: number;
    prev: number | null;
    next: number | null;
    selection: boolean;
};

export const layoutCursorFromState = (state: Editor.State): LayoutCursor => {
    const {math, cursor, selectionStart} = state;
    const parentNode = Editor.nodeAtPath(math, cursor.path);

    let result = {
        parent: parentNode.id,
        prev: cursor.prev,
        next: cursor.next,
        selection: false,
    };
    if (selectionStart) {
        const next =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] + 1
                : selectionStart.next;
        const prev =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] - 1
                : selectionStart.prev;
        if (next != null && cursor.prev != null && next <= cursor.prev + 1) {
            result = {
                parent: parentNode.id,
                prev: prev,
                next: cursor.next,
                selection: true,
            };
        } else {
            result = {
                parent: parentNode.id,
                prev: cursor.prev,
                next: next,
                selection: true,
            };
        }
    }

    if (result.next != null) {
        result.next =
            Editor.nodeAtPath(math, [...cursor.path, result.next])?.id ?? null;
    }

    if (result.prev != null) {
        result.prev =
            Editor.nodeAtPath(math, [...cursor.path, result.prev])?.id ?? null;
    }

    return result;
};
