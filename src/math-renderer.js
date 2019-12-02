// @flow
import * as React from "react";

import * as Layout from "./layout";
import {UnreachableCaseError} from "./util";

type GlyphProps = {glyph: Layout.Glyph, x: number, y: number};

const Glyph = ({glyph, x, y}: GlyphProps): React.Node => {
    return (
        <text x={x} y={y} fontFamily="comic sans ms" fontSize={glyph.size}>
            {glyph.char}
        </text>
    );
};

type HRuleProps = {rule: Layout.HRule, x: number, y: number};

const HRule = ({rule, x, y}: HRuleProps): React.Node => {
    return (
        <line
            stroke="white"
            strokeWidth={rule.thickness}
            strokeLinecap="round"
            x1={x}
            y1={y}
            x2={x + Layout.getWidth(rule)}
            y2={y}
        />
    );
};

type LayoutCursor = {
    parent: number,
    prev: ?number,
    next: ?number,
};

type BoxProps = {
    +box: Layout.Box,
    +cursor: ?LayoutCursor,
    x?: number,
    y?: number,
};

const HBox = ({box, cursor, x = 0, y = 0}: BoxProps): React.Node => {
    const pen = {x: 0, y: 0};
    const availableSpace = box.width - Layout.hlistWidth(box.content);
    const {multiplier} = box;

    let cursorPos: ?{x: number, y: number} = null;

    const result = box.content.map((node, index) => {
        let result = null;

        if (cursor && cursor.next === node.id) {
            cursorPos = {x: pen.x - 1, y: -64 * 0.85 * multiplier};
        }

        switch (node.type) {
            case "Box":
                result = (
                    <Box
                        key={index}
                        box={node}
                        cursor={cursor}
                        x={pen.x}
                        y={pen.y + node.shift}
                    />
                );
                pen.x += Layout.getWidth(node);
                break;
            case "HRule":
                result = <HRule key={index} rule={node} {...pen} />;
                pen.x += Layout.getWidth(node);
                break;
            case "Glue":
                // TODO: add a pen to keep track of the horizontal position of things
                pen.x += availableSpace / 2;
                break;
            case "Glyph":
                result = <Glyph key={index} glyph={node} {...pen} />;
                pen.x += Layout.getWidth(node);
                break;
            case "Kern":
                pen.x += Layout.getWidth(node);
                break;
            default:
                throw new UnreachableCaseError(node);
        }

        if (cursor && cursor.prev === node.id) {
            cursorPos = {x: pen.x - 1, y: -64 * 0.85 * multiplier};
        }

        return result;
    });

    if (box.content.length === 0 && cursor && cursor.parent === box.id) {
        cursorPos = {x: pen.x - 1 + box.width / 2, y: -64 * 0.85 * multiplier};
    }

    if (cursorPos) {
        result.push(
            <rect
                key="cursor"
                {...cursorPos}
                width={2}
                height={64 * multiplier}
            />,
        );
    }

    return <g transform={`translate(${x},${y})`}>{result}</g>;
};

const VBox = ({box, cursor, x = 0, y = 0}: BoxProps): React.Node => {
    const pen = {x: 0, y: 0};
    const availableSpace = box.width - Layout.hlistWidth(box.content);

    pen.y -= box.height;

    const result = box.content.map((node, index) => {
        let result = null;

        switch (node.type) {
            case "Box": {
                pen.y += Layout.getHeight({...node, shift: 0});
                if (Number.isNaN(pen.y)) {
                    // eslint-disable-next-line no-debugger
                    debugger;
                }
                result = (
                    <Box
                        key={index}
                        box={node}
                        cursor={cursor}
                        x={pen.x + node.shift}
                        y={pen.y}
                    />
                );
                pen.y += Layout.getDepth({...node, shift: 0});
                break;
            }
            case "HRule": {
                pen.y += Layout.getHeight(node);
                result = <HRule key={index} rule={node} {...pen} />;
                pen.y += Layout.getDepth(node);
                break;
            }
            case "Glyph": {
                pen.y += Layout.getHeight(node);
                result = <Glyph key={index} glyph={node} {...pen} />;
                pen.y += Layout.getDepth(node);
                break;
            }
            case "Kern": {
                pen.y += node.size;
                break;
            }
            case "Glue": {
                // TODO: add a pen to keep track of the horizontal position of things
                pen.y += availableSpace / 2;
                break;
            }
            default:
                throw new UnreachableCaseError(node);
        }

        return result;
    });

    return <g transform={`translate(${x},${y})`}>{result}</g>;
};

const Box = (props: BoxProps): React.Node => {
    switch (props.box.kind) {
        case "hbox": {
            return <HBox {...props} />;
        }
        case "vbox": {
            return <VBox {...props} />;
        }
        default: {
            throw new UnreachableCaseError(props.box.kind);
        }
    }
};

type Props = {
    box: Layout.Box,
    cursor: ?LayoutCursor,
};

const CURSOR_WIDTH = 2;

const MathRenderer = (props: Props) => {
    const {box, cursor} = props;
    const height = Layout.getHeight(box);
    const depth = Layout.getDepth(box);
    const width = Layout.getWidth(box) + CURSOR_WIDTH;
    const viewBox = `-${CURSOR_WIDTH / 2} -${height} ${width} ${height +
        depth}`;

    return (
        <svg
            style={{margin: 8}}
            width={width}
            height={height + depth}
            viewBox={viewBox}
        >
            <g fill="currentColor">
                <Box box={box} cursor={cursor} />
            </g>
        </svg>
    );
};

export default MathRenderer;
