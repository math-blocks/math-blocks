import * as React from "react";

import {UnreachableCaseError} from "@math-blocks/core";
import {SceneGraph} from "@math-blocks/typesetter";

const Line: React.FunctionComponent<SceneGraph.Line> = ({
    id,
    color,
    ...props
}) => {
    return (
        <line
            {...props}
            stroke={color || "currentColor"}
            strokeWidth={5}
            strokeLinecap="round"
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

const Glyph: React.FunctionComponent<SceneGraph.Glyph> = ({
    x,
    y,
    glyph,
    fontFamily,
}) => {
    const id = typeof glyph.id !== undefined ? String(glyph.id) : undefined;

    return (
        <text
            x={x}
            y={y}
            // TODO: include the fontFamily as part of the value provided by
            // FontMetricsContext and rename to FontDataContext since we'll
            // probably want to include additional non-metrics data such as
            // font outlines and of course which font family to use for a specific
            // glyph
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
};

const Group: React.FunctionComponent<SceneGraph.Group> = ({
    x,
    y,
    layers,
    color,
    id,
}) => {
    const _id = typeof id !== undefined ? String(id) : undefined;

    return (
        <g transform={`translate(${x},${y})`} style={{color: color}} id={_id}>
            {layers.flatMap((layer, i) =>
                layer.map((child, j) => {
                    const key = `${i}-${j}`;
                    return <Node {...child} key={key} />;
                }),
            )}
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
    scene: SceneGraph.Group;
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
            <Group {...scene} />
        </svg>
    );
});

MathRenderer.displayName = "MathRenderer";

export default MathRenderer;
