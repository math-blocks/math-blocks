import * as React from "react";

import {UnreachableCaseError} from "@math-blocks/core";
import {SceneGraph} from "@math-blocks/typesetter";
import * as OpenType from "@math-blocks/opentype";

const Line: React.FunctionComponent<SceneGraph.Line> = ({
    id,
    color,
    thickness,
    ...props
}) => {
    return (
        <line
            {...props}
            stroke={color || "currentColor"}
            strokeWidth={thickness}
            strokeLinecap="butt"
        />
    );
};

const Rect: React.FunctionComponent<SceneGraph.Rect> = ({
    fill,
    id,
    ...props
}) => {
    return <rect {...props} fill={fill || "currentcolor"} />;
};

const getPath = (glyph: OpenType.Glyph): string => {
    let result = "";

    // The glyph's path is in font units.
    const path = glyph.path;

    for (const cmd of path) {
        if (cmd.type === "M") {
            result += `M ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "L") {
            result += `L ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "C") {
            result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
        } else if (cmd.type === "Q") {
            result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
        } else {
            result += "Z";
        }
    }

    return result;
};

enum GlyphRendering {
    Path,
    Text,
}

const Glyph: React.FunctionComponent<SceneGraph.Glyph> = ({x, y, glyph}) => {
    const id = typeof glyph.id !== undefined ? String(glyph.id) : undefined;

    const {font} = glyph.fontData;
    const scale = glyph.size / font.head.unitsPerEm;

    const glyphRendering: GlyphRendering = GlyphRendering.Path;

    if (glyphRendering === GlyphRendering.Path) {
        return (
            <path
                fill={glyph.color || "currentcolor"}
                id={id}
                style={{opacity: glyph.pending ? 0.5 : 1.0}}
                aria-hidden="true"
                d={getPath(font.getGlyph(glyph.glyphID))}
                transform={`translate(${x}, ${y}) scale(${scale}, -${scale})`}
            />
        );
    } else {
        const {fontFamily} = glyph.fontData;
        return (
            <text
                x={x}
                y={y}
                fontFamily={fontFamily}
                fontSize={glyph.size}
                fill={glyph.color || "currentcolor"}
                id={id}
                style={{opacity: glyph.pending ? 0.5 : 1.0}}
                aria-hidden="true"
            >
                {glyph.char}
            </text>
        );
    }
};

const Group: React.FunctionComponent<SceneGraph.Group> = ({
    x,
    y,
    children,
    color,
    id,
}) => {
    const _id = typeof id !== undefined ? String(id) : undefined;

    return (
        <g transform={`translate(${x},${y})`} style={{color: color}} id={_id}>
            {children.map((child, i) => {
                const key = `${i}`;
                return <Node {...child} key={key} />;
            })}
        </g>
    );
};

const Node: React.FunctionComponent<SceneGraph.Node> = (props) => {
    switch (props.type) {
        case "glyph":
            return <Glyph {...props} />;
        case "group":
            return <Group {...props} />;
        case "line":
            return <Line {...props} />;
        case "rect":
            return <Rect {...props} />;
        default:
            throw new UnreachableCaseError(props);
    }
};

const CURSOR_WIDTH = 2;

type Props = {
    scene: SceneGraph.Scene;
    style?: React.CSSProperties;
};

const MathRenderer = React.forwardRef<SVGSVGElement, Props>((props, ref) => {
    const {scene, style} = props;
    const {width, height} = scene;
    const padding = CURSOR_WIDTH / 2;
    const viewBox = `-${padding} 0 ${width + CURSOR_WIDTH} ${height}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            width={width + CURSOR_WIDTH}
            height={height}
            style={style}
            ref={ref}
        >
            <Group {...scene.selection} />
            <Group {...scene.content} />
            <Group {...scene.hitboxes} />
        </svg>
    );
});

MathRenderer.displayName = "MathRenderer";

export default MathRenderer;
