import * as React from "react";

import {SceneGraph, Layout} from "@math-blocks/typesetter";

type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

const Line: React.SFC<SceneGraph.Line> = (props) => {
    return (
        <line
            {...props}
            stroke={props.color || "currentColor"}
            strokeWidth={5}
            strokeLinecap="round"
        />
    );
};

const Rect: React.SFC<SceneGraph.Rect> = ({color, ...props}) => {
    return <rect {...props} fill={color} />;
};

const Glyph: React.SFC<SceneGraph.Glyph> = ({x, y, glyph}) => {
    return (
        <text
            x={x}
            y={y}
            fontFamily="comic sans ms"
            fontSize={glyph.size}
            fill={glyph.color || (glyph.pending ? "#CCC" : "black")}
            id={glyph.id}
        >
            {glyph.char}
        </text>
    );
};

const Group: React.SFC<SceneGraph.Group> = ({x, y, layers, color, id}) => {
    return (
        <g
            transform={`translate(${x},${y})`}
            fill={color}
            stroke={color}
            id={id}
        >
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
