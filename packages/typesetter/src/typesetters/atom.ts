import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";
import {fontSizeForContext} from "../utils";

import type {Context} from "../types";

const canBeUnary = (char: string): boolean => {
    const unaryOperators = [
        "+",
        "\u2212", // \minus
        "\u00B1", // \pm
    ];

    return unaryOperators.includes(char);
};

const shouldHavePadding = (
    prevNode: Editor.types.Node | Editor.Focus | undefined,
    currentNode: Editor.types.Atom,
    context: Context,
): boolean => {
    const currentChar = currentNode.value.char;

    // We only add padding around operators, so if we get a non-operator char
    // we can return early.
    if (!Editor.util.isOperator(currentNode)) {
        return false;
    }

    // No operators get padding when `cramped` is true
    if (context.cramped) {
        return false;
    }

    // If the currentChar can be unary we check a number of situations where it
    // should be unary and don't give it any padding in those situations.
    if (canBeUnary(currentChar)) {
        if (
            !prevNode ||
            (prevNode.type === "atom" && Editor.util.isOperator(prevNode)) ||
            prevNode.type === "limits" ||
            prevNode.type === "zlimits"
        ) {
            return false;
        }
    }

    // All other operators should have padding around them.
    return true;
};

export const maybeAddOperatorPadding = (
    prevNode: Editor.types.Node | Editor.Focus | undefined,
    currentNode: Editor.types.Atom,
    context: Context,
    padOperator?: boolean,
): Layout.Node => {
    const glyph = typesetAtom(currentNode, context);
    const fontSize = fontSizeForContext(context);
    const result =
        (padOperator && Editor.util.isOperator(currentNode)) ||
        shouldHavePadding(prevNode, currentNode, context)
            ? Layout.makeStaticHBox(
                  [
                      Layout.makeKern(fontSize / 4),
                      glyph,
                      Layout.makeKern(fontSize / 4),
                  ],
                  context,
              )
            : glyph;
    if (result !== glyph) {
        result.id = glyph.id;
        delete glyph.id;
        // Move the style to the result so that cancel overlays are
        // continuous even when they include an operator with padding.
        result.style = glyph.style;
        glyph.style = {};
    }
    return result;
};

export const typesetAtom = (
    node: Editor.types.Atom,
    context: Context,
): Layout.Glyph => {
    const {font} = context.fontData;

    const {value} = node;

    const glyphID = font.getGlyphID(value.char);
    let glyph = Layout.makeGlyph(value.char, glyphID, context);

    // Convert individual glyphs to italic glyphs if they exist in the
    // current font.
    if (/[a-z]/.test(value.char) && !context.operator) {
        const offset = value.char.charCodeAt(0) - "a".charCodeAt(0);
        const char = String.fromCodePoint(0x1d44e + offset);
        const glyphID = font.getGlyphID(char);
        glyph = Layout.makeGlyph(char, glyphID, context);
    }

    glyph.id = node.id;
    glyph.style = node.style;
    glyph.pending = node.value.pending;
    return glyph;
};
