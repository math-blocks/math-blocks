import * as React from 'react';

import { UnreachableCaseError } from '@math-blocks/core';
import { SceneGraph } from '@math-blocks/typesetter';
import * as OpenType from '@math-blocks/opentype';

import { lerpPath } from './lerp';

const Line = ({
  id,
  style,
  thickness,
  ...props
}: SceneGraph.Line): React.ReactElement => {
  return (
    <line
      {...props}
      stroke={style.stroke || 'currentColor'}
      strokeWidth={thickness}
      strokeLinecap="butt"
    />
  );
};

const Rect = ({ fill, id, ...props }: SceneGraph.Rect): React.ReactElement => {
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

// Glyph IDs are only unique within a font, so definitions are keyed by font
// family plus glyph ID. The result is used as part of an XML ID, so anything
// other than letters, digits, '-' and '_' is replaced.
const getGlyphKey = (glyph: SceneGraph.Glyph['glyph']): string => {
  const family = glyph.fontData.fontFamily.replace(/[^A-Za-z0-9_-]/g, '_');
  return `${family}-${glyph.glyphID}`;
};

// The prefix for the IDs of this SVG's glyph definitions. It comes from
// React's useId() so that two renderers on the same page can't collide.
const GlyphDefsContext = React.createContext<string>('');

const getGlyphDefId = (prefix: string, key: string): string =>
  `${prefix}-${key}`;

type GlyphDef = {
  readonly key: string;
  readonly d: string;
};

// Returns the distinct glyphs used by the given nodes (and their descendants),
// in the order they're first drawn, so that each outline is only stored once,
// in the SVG's <defs>.
const getGlyphDefs = (
  nodes: readonly SceneGraph.Node[],
): readonly GlyphDef[] => {
  const defs = new Map<string, GlyphDef>();

  const visit = (node: SceneGraph.Node): void => {
    switch (node.type) {
      case 'char': {
        if (node.glyph.placeholder) {
          // Placeholders draw their own "?" mark; see PlaceholderGlyph.
          return;
        }
        const key = getGlyphKey(node.glyph);
        if (!defs.has(key)) {
          const { font } = node.glyph.fontData;
          const d = getPath(font.getGlyph(node.glyph.glyphID));
          defs.set(key, { key, d });
        }
        return;
      }
      case 'group':
        node.children.forEach(visit);
        return;
      default:
        // Interpolated glyphs compute a new outline each frame, so they draw
        // their own <path> instead of using a definition.
        return;
    }
  };

  nodes.forEach(visit);

  return [...defs.values()];
};

// Draws a glyph the font couldn't provide as a rounded box with a "?" in it.
const PlaceholderGlyph = ({
  x,
  y,
  glyph,
  style,
  placeholder,
}: SceneGraph.Glyph & {
  readonly placeholder: OpenType.GlyphMetrics;
}): React.ReactElement => {
  const id = typeof glyph.id !== 'undefined' ? String(glyph.id) : undefined;
  const { font } = glyph.fontData;
  const scale = glyph.size / font.head.unitsPerEm;
  const strokeWidth = glyph.size * font.math.constants.fractionRuleThickness;

  // The box, inset by half the stroke so its outside edge matches the metrics.
  const left = x + placeholder.bearingX * scale + strokeWidth / 2;
  const top = y - placeholder.bearingY * scale + strokeWidth / 2;
  const width = placeholder.width * scale - strokeWidth;
  const height = placeholder.height * scale - strokeWidth;

  // The "?", scaled down and centred in the box.
  const mark = font.getGlyphMetrics(glyph.glyphID);
  const markScale = scale * 0.7;
  const markX = left + width / 2 - (mark.bearingX + mark.width / 2) * markScale;
  const markY =
    top + height / 2 + (mark.bearingY - mark.height / 2) * markScale;

  return (
    <g
      id={id}
      style={{ opacity: glyph.pending ? 0.5 : 1.0 }}
      aria-hidden="true"
    >
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={width * 0.2}
        fill="none"
        stroke={style.fill ?? 'currentColor'}
        strokeWidth={strokeWidth}
      />
      <path
        fill={style.fill}
        d={getPath(font.getGlyph(glyph.glyphID))}
        transform={`translate(${markX}, ${markY}) scale(${markScale}, -${markScale})`}
      />
    </g>
  );
};

const Glyph = (props: SceneGraph.Glyph): React.ReactElement => {
  const { x, y, glyph, style } = props;
  const prefix = React.useContext(GlyphDefsContext);
  if (glyph.placeholder) {
    return <PlaceholderGlyph {...props} placeholder={glyph.placeholder} />;
  }

  const id = typeof glyph.id !== 'undefined' ? String(glyph.id) : undefined;

  const { font } = glyph.fontData;
  const scale = glyph.size / font.head.unitsPerEm;

  // Always uses paths since browsers do weird things to glyphs when rendering
  // them in <text> elements. The outline itself lives in the SVG's <defs>;
  // fill and opacity set here apply to the referenced path.
  return (
    <use
      fill={style.fill}
      id={id}
      style={{ opacity: glyph.pending ? 0.5 : 1.0 }}
      aria-hidden="true"
      href={`#${getGlyphDefId(prefix, getGlyphKey(glyph))}`}
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
}: SceneGraph.InterpolatedGlyph): React.ReactElement => {
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

const Group = ({
  x,
  y,
  children,
  style,
  id,
}: SceneGraph.Group): React.ReactElement => {
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

const Node = (props: SceneGraph.Node): React.ReactElement => {
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

  // useId() returns IDs like ':r0:'. Colons are valid in XML IDs but awkward
  // in URL fragments and CSS selectors, so they're dropped.
  const prefix = `mb${React.useId().replace(/:/g, '')}`;

  const glyphDefs = getGlyphDefs(
    showHitboxes
      ? [scene.selection, scene.content, scene.hitboxes]
      : [scene.selection, scene.content],
  );

  return (
    <GlyphDefsContext.Provider value={prefix}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={width + CURSOR_WIDTH}
        height={height}
        style={style}
        ref={ref}
      >
        {glyphDefs.length > 0 && (
          <defs>
            {glyphDefs.map(({ key, d }) => (
              <path key={key} id={getGlyphDefId(prefix, key)} d={d} />
            ))}
          </defs>
        )}
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
    </GlyphDefsContext.Provider>
  );
});

SceneRenderer.displayName = 'SceneRenderer';

export default SceneRenderer;
