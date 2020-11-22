import * as React from "react";

import {SceneGraph, Layout} from "@math-blocks/typesetter";

type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

const Line: React.SFC<SceneGraph.Line> = ({id, color, ...props}) => {
    return (
        <line
            {...props}
            stroke={color || "currentColor"}
            strokeWidth={5}
            strokeLinecap="round"
        />
    );
};

const Rect: React.SFC<SceneGraph.Rect> = ({color, id, ...props}) => {
    return <rect {...props} fill={color} />;
};

const Glyph: React.SFC<SceneGraph.Glyph> = ({x, y, glyph}) => {
    const id = typeof glyph.id !== undefined ? String(glyph.id) : undefined;

    return (
        <text
            x={x}
            y={y}
            fontFamily="comic sans ms"
            fontSize={glyph.size}
            fill={glyph.color || "currentcolor"}
            id={id}
            style={{opacity: glyph.pending ? 0.5 : 1.0}}
        >
            {glyph.char}
        </text>
    );
};

const Group: React.SFC<SceneGraph.Group> = ({x, y, layers, color, id}) => {
    const _id = typeof id !== undefined ? String(id) : undefined;

    return (
        <g transform={`translate(${x},${y})`} style={{color: color}} id={_id}>
            {layers.flatMap((layer, i) =>
                layer.map((child, j) => {
                    const key = `${i}-${j}`;
                    switch (child.type) {
                        case "group":
                            return <Group key={key} {...child} />;
                        case "glyph":
                            return <Glyph key={key} {...child} />;
                        case "line":
                            return <Line key={key} {...child} />;
                        case "rect":
                            return <Rect key={key} {...child} />;
                    }
                }),
            )}
        </g>
    );
};

const CURSOR_WIDTH = 2;

const MathRenderer: React.SFC<{
    box: Layout.Box;
    cursor?: LayoutCursor;
    cancelRegions?: LayoutCursor[];
}> = (props) => {
    const group = SceneGraph.render(props);
    const {width, height} = group;
    const padding = CURSOR_WIDTH / 2;
    const viewBox = `-${padding} 0 ${width + CURSOR_WIDTH} ${height}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            width={width}
            height={height + CURSOR_WIDTH}
        >
            <Group {...group} />
        </svg>
    );
};

export default MathRenderer;
