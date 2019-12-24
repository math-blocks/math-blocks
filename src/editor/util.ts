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
