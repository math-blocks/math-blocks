import * as Editor from "./editor";

export const isEqual = (
    a: Editor.Node<Editor.Glyph>,
    b: Editor.Node<Editor.Glyph>,
): boolean => {
    if (a.type !== b.type) {
        return false;
    } else if (a.type === "atom" && b.type === "atom") {
        return a.value.char === b.value.char;
    } else if (a.type === "parens" && b.type === "parens") {
        if (a.children.length !== b.children.length) {
            return false;
        }
        return a.children.every((aChild, index) =>
            isEqual(aChild, b.children[index]),
        );
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

export const row = (str: string): Editor.Row<Editor.Glyph> =>
    Editor.row(str.split("").map(glyph => Editor.glyph(glyph)));

export const parens = (str: string): Editor.Parens<Editor.Glyph> =>
    Editor.parens(str.split("").map(glyph => Editor.glyph(glyph)));

export const frac = (num: string, den: string): Editor.Frac<Editor.Glyph> =>
    Editor.frac(
        num.split("").map(glyph => Editor.glyph(glyph)),
        den.split("").map(glyph => Editor.glyph(glyph)),
    );

export const sqrt = (radicand: string): Editor.Root<Editor.Glyph> =>
    Editor.root(
        radicand.split("").map(glyph => Editor.glyph(glyph)),
        null,
    );

export const root = (
    radicand: string,
    index: string,
): Editor.Root<Editor.Glyph> =>
    Editor.root(
        radicand.split("").map(glyph => Editor.glyph(glyph)),
        index.split("").map(glyph => Editor.glyph(glyph)),
    );

export const sup = (sup: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        undefined,
        sup.split("").map(glyph => Editor.glyph(glyph)),
    );

export const sub = (sub: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        sub.split("").map(glyph => Editor.glyph(glyph)),
        undefined,
    );

export const subsup = (sub: string, sup: string): Editor.SubSup<Editor.Glyph> =>
    Editor.subsup(
        sub.split("").map(glyph => Editor.glyph(glyph)),
        sup.split("").map(glyph => Editor.glyph(glyph)),
    );
