import * as React from 'react';

import { UnreachableCaseError } from '@math-blocks/core';
import { SceneGraph } from '@math-blocks/typesetter';
import * as OpenType from '@math-blocks/opentype';

import { lerpPath } from './lerp';

const Line = ({ id, style, thickness, ...props }: SceneGraph.Line) => {
  return (
    <line
      {...props}
      stroke={style.stroke || 'currentColor'}
      strokeWidth={thickness}
      strokeLinecap="butt"
    />
  );
};

const Rect = ({ fill, id, ...props }: SceneGraph.Rect) => {
  return <rect {...props} fill={fill} stroke="none" />;
};

const svgPathFromFontPath = (path: OpenType.Path): string => {
  let result = '';

  for (const cmd of path) {
    if (cmd.type === 'M') {
      result += `M ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'L') {
      result += `L ${cmd.x},${cmd.y} `;
    } else if (cmd.type === 'C') {
      result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
    } else if (cmd.type === 'Q') {
      result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
    } else {
      result += 'Z';
    }
  }

  return result;
};

const getPath = (glyph: OpenType.Glyph): string => {
  // The glyph's path is in font units.
  const path = glyph.path;

  return svgPathFromFontPath(path);
};

const Glyph = ({ x, y, glyph, style }: SceneGraph.Glyph) => {
  const id = typeof glyph.id !== 'undefined' ? String(glyph.id) : undefined;

  const { font } = glyph.fontData;
  const scale = glyph.size / font.head.unitsPerEm;

  // Always uses paths since browsers do weird things to glyphs when rendering
  // them in <text> elements.
  return (
    <path
      fill={style.fill}
      id={id}
      style={{ opacity: glyph.pending ? 0.5 : 1.0 }}
      aria-hidden="true"
      d={getPath(font.getGlyph(glyph.glyphID))}
      transform={`translate(${x}, ${y}) scale(${scale}, -${scale})`}
    />
  );
};

const InterpolatedGlyph = ({
  x,
  y,
  interpolatedGlyph,
  amount,
  style,
}: SceneGraph.InterpolatedGlyph) => {
  const id =
    typeof interpolatedGlyph.id !== 'undefined'
      ? String(interpolatedGlyph.id)
      : undefined;

  const { font } = interpolatedGlyph.fontData; // glyph1 and glyph2 should have the same font
  const scale = interpolatedGlyph.size / font.head.unitsPerEm; // glyph1 and glyph2 should have the same size

  const { path: path1 } = font.getGlyph(interpolatedGlyph.glyphID1);
  const { path: path2 } = font.getGlyph(interpolatedGlyph.glyphID2);

  const path = lerpPath(path1, path2, amount);

  // Always uses paths since browsers do weird things to glyphs when rendering
  // them in <text> elements.
  return (
    <path
      fill={style.fill}
      id={id}
      style={{ opacity: interpolatedGlyph.pending ? 0.5 : 1.0 }}
      aria-hidden="true"
      d={svgPathFromFontPath(path)}
      transform={`translate(${x}, ${y}) scale(${scale}, -${scale})`}
    />
  );
};

const Group = ({ x, y, children, style, id }: SceneGraph.Group) => {
  const _id = typeof id !== 'undefined' ? String(id) : undefined;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ color: style.stroke }}
      id={_id}
    >
      {children.map((child, i) => {
        const key = child.key || `${i}`;
        return <Node {...child} key={key} />;
      })}
    </g>
  );
};

const Node = (props: SceneGraph.Node) => {
  switch (props.type) {
    case 'char':
      return <Glyph {...props} />;
    case 'interpolated':
      return <InterpolatedGlyph {...props} />;
    case 'group':
      return <Group {...props} />;
    case 'line':
      return <Line {...props} />;
    case 'rect':
      return <Rect {...props} />;
    default:
      throw new UnreachableCaseError(props);
  }
};

const CURSOR_WIDTH = 2;

type Props = {
  readonly scene: SceneGraph.Scene;
  readonly style?: React.CSSProperties;
  readonly showHitboxes?: boolean;
};

const SceneRenderer = React.forwardRef<SVGSVGElement, Props>((props, ref) => {
  const { scene, style, showHitboxes } = props;
  const { width, height } = scene;
  const padding = CURSOR_WIDTH / 2;
  const viewBox = `-${padding} 0 ${width + CURSOR_WIDTH} ${height}`;
  const { bounds } = scene.content;
  const yAdjust = height - (bounds.depth + bounds.height);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width + CURSOR_WIDTH}
      height={height}
      style={style}
      ref={ref}
    >
      <g
        fill="currentColor"
        stroke="none"
        transform={`translate(0,${yAdjust})`}
      >
        <Group {...scene.selection} />
        {/**
         * We set 'fill' and stroke to 'currentColor' so that the base
         * color is whatever the current CSS 'color' property is set up.
         * Individual nodes within the scene can override their style's
         * color and the render above will set the fill and/or stroke in
         * rendered SVG element appropriately.
         */}
        <Group {...scene.content} />
      </g>
      {showHitboxes && <Group {...scene.hitboxes} />}
    </svg>
  );
});

SceneRenderer.displayName = 'SceneRenderer';

export default SceneRenderer;
