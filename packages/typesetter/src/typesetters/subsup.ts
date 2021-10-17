import * as Editor from "@math-blocks/editor";
import type {Mutable} from "utility-types";

import * as Layout from "../layout";
import {MathStyle} from "../enums";

import type {Context, Node, HBox, VBox, Kern} from "../types";

const childContextForSubsup = (context: Context): Context => {
    const {mathStyle} = context;

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Script,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const childContext: Context = {
        ...context,
        mathStyle: childMathStyle,
        cramped: true,
    };

    return childContext;
};

export const typesetSubsup = (
    typesetChild: (index: number, context: Context) => HBox | null,
    node: Editor.types.CharSubSup | Editor.ZSubSup,
    context: Context,
    prevEditNode?: Editor.types.CharNode | Editor.Focus,
    prevLayoutNode?: Node,
): VBox => {
    const childContext = childContextForSubsup(context);
    const subBox = typesetChild(0, childContext);
    const supBox = typesetChild(1, childContext);

    if (!supBox && !subBox) {
        throw new Error("at least one of supBox and subBox must be defined");
    }

    const {font} = context.fontData;

    const width = Math.max(
        supBox ? Layout.getWidth(supBox) : 0,
        subBox ? Layout.getWidth(subBox) : 0,
    );

    // Some atoms gets wrapped in a box to add padding to them so we need to
    // filter them out.  Anything else that's in a box is some sort of compound
    // layout structure (frac, delimited, etc.) and should have its subscript
    // and/or superscript positioned based on the size of the box.
    if (prevEditNode?.type !== "char" && prevLayoutNode) {
        const {superscriptBaselineDropMax, subscriptBaselineDropMin} =
            font.math.constants;

        const baselineDropMax = Layout.getConstantValue(
            superscriptBaselineDropMax,
            context,
        );
        const baselineDropMin = Layout.getConstantValue(
            subscriptBaselineDropMin,
            context,
        );

        const upList = [];
        const dnList = [];

        if (supBox) {
            const shift = Layout.getHeight(prevLayoutNode);
            const kernShift = shift - baselineDropMax;

            upList.push(Layout.makeKern(kernShift));
            upList.push(supBox);
        }

        if (subBox) {
            const shift = Layout.getDepth(prevLayoutNode);
            const kernSize = shift - baselineDropMin;

            dnList.push(Layout.makeKern(kernSize));
            dnList.push(subBox);
        }

        const referenceNode = Layout.makeKern(0); // empty reference node
        const subsupBox = Layout.makeVBox(
            width,
            referenceNode,
            upList,
            dnList,
            context,
        ) as Mutable<VBox>;

        subsupBox.id = node.id;
        subsupBox.style = node.style;

        return subsupBox;
    }

    const {
        subscriptTopMax,
        superscriptBottomMin,
        subscriptShiftDown,
        superscriptShiftUp,
        subSuperscriptGapMin,
        superscriptBottomMaxWithSubscript,
    } = font.math.constants;

    const bottomMin = Layout.getConstantValue(superscriptBottomMin, context);
    const shiftUp = Layout.getConstantValue(superscriptShiftUp, context);
    const topMax = Layout.getConstantValue(subscriptTopMax, context);
    const shiftDown = Layout.getConstantValue(subscriptShiftDown, context);

    const upList = [];

    if (supBox) {
        // compute shift in baseline of superscript
        const shift = Math.max(shiftUp, supBox.depth + bottomMin);

        // -supBox.depth is to align the baseline of the superscript with the
        // baseline of the base.
        // TODO: replace the up/dn list that makeVBox uses with something else
        // that doesn't require this correction
        const kernShift = -supBox.depth + shift;

        upList.push(Layout.makeKern(kernShift) as Mutable<Kern>);
        upList.push(supBox as Mutable<HBox>);
    }

    const dnList = [];

    if (subBox) {
        // compute shift in baseline of subscript
        let shift = Math.max(shiftDown, subBox.height - topMax);

        if (supBox) {
            const supBoxShift = Math.max(shiftUp, supBox.depth + bottomMin);

            const supBottom = supBoxShift - supBox.depth;
            const subTop = subBox.height - shift;

            const gap = supBottom - subTop;
            const gapMin = Layout.getConstantValue(
                subSuperscriptGapMin,
                context,
            );

            if (gap < gapMin) {
                if (upList[0].type === "Kern" && upList[1].type === "HBox") {
                    // shift the superscript up to increase the gap
                    const correction = gapMin - gap;
                    upList[0].size += correction;

                    // We can't use upList[0].size in the calculation since it
                    // includes the initial -supBox.depth to align baselines.
                    const supBottom =
                        supBoxShift + correction - upList[1].depth;
                    const supBottomMax = Layout.getConstantValue(
                        superscriptBottomMaxWithSubscript,
                        context,
                    );

                    if (supBottom > supBottomMax) {
                        // shift both down to maintain to gap
                        const correcion = supBottom - supBottomMax;
                        upList[0].size -= correcion;
                        shift += correcion; // down is positive for dnList
                    }
                }
            }
        }

        // We start with -subBox.height to align the subscript's baseline with
        // the baseline of the base it's attached to
        // TODO: replace the up/dn list that makeVBox uses with something else
        // that doesn't require this correction
        const kernSize = -subBox.height + shift;

        dnList.push(Layout.makeKern(kernSize));
        dnList.push(subBox);
    }

    const referenceNode = Layout.makeKern(0); // empty reference node
    const subsupBox = Layout.makeVBox(
        width,
        referenceNode,
        upList,
        dnList,
        context,
    ) as Mutable<VBox>;

    subsupBox.id = node.id;
    subsupBox.style = node.style;

    return subsupBox;
};
