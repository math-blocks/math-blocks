import * as React from "react";

import {SceneGraph, Layout} from "@math-blocks/typesetter";

const Line: React.SFC<SceneGraph.Line> = (props) => {
    return (
        <line
            {...props}
            stroke="currentColor"
            strokeWidth={5}
            strokeLinecap="round"
        />
    );
};

const Glyph: React.SFC<SceneGraph.Glyph> = ({x, y, glyph}) => {
    return (
        <text
            x={x}
            y={y}
            fontFamily="comic sans ms"
            fontSize={glyph.size}
            fill={glyph.pending ? "#CCC" : "black"}
        >
            {glyph.char}
        </text>
    );
};

const Group: React.SFC<SceneGraph.Group> = ({x, y, children}) => {
    return (
        <g transform={`translate(${x},${y})`}>
            {children.map((child, index) => {
                switch (child.type) {
                    case "group":
                        return <Group key={index} {...child} />;
                    case "glyph":
                        return <Glyph key={index} {...child} />;
                    case "line":
                        return <Line key={index} {...child} />;
                }
            })}
        </g>
    );
};

const SceneGraphRenderer: React.SFC<{box: Layout.Box}> = (props) => {
    const group = SceneGraph.render(props.box);
    const {width, height} = group;
    const viewBox = `0 0 ${width} ${height}`;

    return (
        <svg
            viewBox={viewBox}
            width={width}
            height={height}
            style={{margin: 8}}
        >
            <Group {...group} />
        </svg>
    );
};

export default SceneGraphRenderer;
