import * as Editor from "./editor-ast";
import {State} from "./editor-reducer";

export const isEqual = (
    a: Editor.Node<Editor.Glyph>,
    b: Editor.Node<Editor.Glyph>,
): boolean => {
    if (a.type !== b.type) {
        return false;
    } else if (a.type === "atom" && b.type === "atom") {
        return a.value.char === b.value.char;
    } else if (a.type === "frac" && b.type === "frac") {
        const [aNum, aDen] = a.children;
        const [bNum, bDen] = b.children;
        return isEqual(aNum, bNum) && isEqual(aDen, bDen);
    } else if (a.type === "root" && b.type === "root") {
        const [aRad, aIndex] = a.children;
        const [bRad, bIndex] = b.children;
        if (isEqual(aRad, bRad)) {
            return aIndex != null && bIndex != null
                ? isEqual(aIndex, bIndex)
                : aIndex === bIndex;
        } else {
            return false;
        }
    } else if (a.type === "subsup" && b.type === "subsup") {
        const [aSub, aSup] = a.children;
        const [bSub, bSup] = b.children;

        if (aSub == null || bSub == null) {
            if (aSub != bSub) {
                return false;
            }
        }
        if (aSup == null || bSup == null) {
            if (aSup != bSup) {
                return false;
            }
        }
        if (aSub != null && bSub != null) {
            if (!isEqual(aSub, bSub)) {
                return false;
            }
        }
        if (aSup != null && bSup != null) {
            if (!isEqual(aSup, bSup)) {
                return false;
            }
        }

        return true;
    } else if (a.type === "row" && b.type === "row") {
        if (a.children.length !== b.children.length) {
            return false;
        }
        return a.children.every((aChild, index) =>
            isEqual(aChild, b.children[index]),
        );
    } else {
        return false;
    }
};

export type ID = {
    id: number;
};

export const row = (str: string): Editor.Row<Editor.Glyph, ID> =>
    Editor.row(str.split("").map((glyph) => Editor.glyph(glyph)));

export const frac = (num: string, den: string): Editor.Frac<Editor.Glyph, ID> =>
    Editor.frac(
        num.split("").map((glyph) => Editor.glyph(glyph)),
        den.split("").map((glyph) => Editor.glyph(glyph)),
    );

export const sqrt = (radicand: string): Editor.Root<Editor.Glyph, ID> =>
    Editor.root(
        radicand.split("").map((glyph) => Editor.glyph(glyph)),
        null,
    );

export const root = (
    radicand: string,
    index: string,
): Editor.Root<Editor.Glyph, ID> =>
    Editor.root(
        radicand.split("").map((glyph) => Editor.glyph(glyph)),
        index.split("").map((glyph) => Editor.glyph(glyph)),
    );

export const sup = (sup: string): Editor.SubSup<Editor.Glyph, ID> =>
    Editor.subsup(
        undefined,
        sup.split("").map((glyph) => Editor.glyph(glyph)),
    );

export const sub = (sub: string): Editor.SubSup<Editor.Glyph, ID> =>
    Editor.subsup(
        sub.split("").map((glyph) => Editor.glyph(glyph)),
        undefined,
    );

export const subsup = (
    sub: string,
    sup: string,
): Editor.SubSup<Editor.Glyph, ID> =>
    Editor.subsup(
        sub.split("").map((glyph) => Editor.glyph(glyph)),
        sup.split("").map((glyph) => Editor.glyph(glyph)),
    );

export type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

// TODO: dedupe with react/utils.ts
export const layoutCursorFromState = (state: State): LayoutCursor => {
    const {math, cursor, selectionStart} = state;
    const parentNode = Editor.nodeAtPath(math, cursor.path);

    let result = {
        parent: parentNode.id,
        prev: cursor.prev,
        next: cursor.next,
        selection: false,
    };

    if (selectionStart) {
        if (parentNode.type !== "row") {
            throw new Error("selection container isn't a row");
        }

        // Set prev/next to the node at the same level as the cursor
        // that contains the selectionStart or use the selectionStart
        // if it's at the same level as the cursor.
        let next =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] + 1
                : selectionStart.next;
        let prev =
            selectionStart.path.length > cursor.path.length
                ? selectionStart.path[cursor.path.length] - 1
                : selectionStart.prev;

        // Use the cursor's next if it comes after next.
        if (
            next !== Infinity &&
            cursor.next !== Infinity &&
            cursor.next > next
        ) {
            next = cursor.next;
        } else if (cursor.next === Infinity) {
            next = cursor.next;
        }

        // Use the cursor's prev if it comes before prev.
        if (
            prev !== -Infinity &&
            cursor.prev !== -Infinity &&
            cursor.prev < prev
        ) {
            prev = cursor.prev;
        } else if (cursor.prev === -Infinity) {
            prev = cursor.prev;
        }

        // Set selection to true if there's a node between the prev and
        // next.
        let selection = false;
        if (next !== Infinity && prev !== -Infinity && next - prev > 1) {
            selection = true;
        } else if (next !== Infinity && prev === -Infinity && next > 0) {
            selection = true;
        } else if (
            next === Infinity &&
            prev !== -Infinity &&
            prev < parentNode.children.length - 1
        ) {
            selection = true;
        } else if (
            next === Infinity &&
            prev === -Infinity &&
            parentNode.children.length > 0
        ) {
            selection = true;
        }

        result = {
            parent: parentNode.id,
            prev,
            next,
            selection,
        };
    }

    return result;
};
