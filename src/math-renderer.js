// @flow
import * as React from "react";

import {type Box, getWidth, vsize, hlistWidth, getHeight, getDepth} from "./layout";
import {UnreachableCaseError} from "./util";
import {type EditorCursor} from "./editor";

type Props = {
  box: Box,
  cursor: EditorCursor,
};

class MathRenderer extends React.Component<Props> {
  renderBox(box: Box): React.Node {
    const pen = {x: 0, y: 0};
    const {cursor} = this.props;

    switch (box.kind) {
      case "hbox": {
        const availableSpace = box.width - hlistWidth(box.content);
        const parentId = cursor.path[cursor.path.length - 1];

        return box.content.flatMap((node, index) => {
          const result = [];

          if (parentId === box.id && cursor.next === node.id) {
            result.push(<rect 
              key="cursor-1" x={pen.x - 1} y={-64 * 0.85} width={2} height={64} 
            />)
          }

          switch (node.type) {
            case "Box":
              result.push(<g 
                key={index} 
                transform={`translate(${pen.x}, ${pen.y + node.shift})`}
              >
                {this.renderBox(node)}
              </g>);
              pen.x += getWidth(node);
              break;
            case "Rule":
              result.push(<rect 
                key={index} 
                x={pen.x} y={pen.y - getHeight(node)} 
                width={getWidth(node)} height={vsize(node)} 
              />);
              pen.x += getWidth(node);
              break;
            case "Glue":
              // TODO: add a pen to keep track of the horizontal position of things
              pen.x += availableSpace / 2;
              break;
            case "Glyph":
              result.push(<text 
                key={index} 
                x={pen.x} y={pen.y} 
                fontFamily="comic sans ms"
                fontSize={node.size}
              >
                {node.char}
              </text>);
              pen.x += getWidth(node);
              break;
            case "Kern":
              pen.x += getWidth(node);
              break;
            default:
              throw new UnreachableCaseError(node);
          }

          if (parentId === box.id && cursor.prev === node.id) {
            result.push(<rect 
              key="cursor-2" x={pen.x - 1} y={-64 * 0.85} width={2} height={64} 
            />)
          }

          return result;
        });
      }
      case "vbox": {
        const availableSpace = box.width - hlistWidth(box.content);

        pen.y -= box.height;
        return box.content.flatMap((node, index) => {
          const result = [];

          switch (node.type) {
            case "Box": {
              pen.y += getHeight(node);
              if (Number.isNaN(pen.y)) {
                debugger;
              }
              result.push(<g 
                key={index} 
                transform={`translate(${pen.x}, ${pen.y})`}
              >
                {this.renderBox(node)}
              </g>);
              pen.y += getDepth(node);
              break;
            }
            case "Rule": {
              pen.y += getHeight(node);
              result.push(<rect 
                key={index} 
                x={pen.x} y={pen.y - getHeight(node)} 
                width={getWidth(node)} height={vsize(node)} 
              />);
              pen.y += getDepth(node);
              break;
            }
            case "Glyph": {
              pen.y += getHeight(node);
              result.push(<text 
                key={index} 
                x={pen.x} y={pen.y} 
                fontFamily="comic sans ms"
                fontSize={node.size}
              >
                {node.char}
              </text>);
              pen.y += getDepth(node);
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
            default: throw new UnreachableCaseError(node);
          }

          return result;
        });
      }
      default: {
        throw new UnreachableCaseError(box.kind);
      }
    }
  }

  render() {
    const {box} = this.props;
    const height = getHeight(box);
    const depth = getDepth(box);
    const width = getWidth(box);
    const viewBox = `0 -${height} ${width} ${height + depth}`;

    return <svg style={{marginLeft: 100}} width={width} viewBox={viewBox}>
      <g fill="currentColor">
        {this.renderBox(box)}
      </g>
    </svg>;
  }
}

export default MathRenderer;
