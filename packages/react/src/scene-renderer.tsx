import * as React from 'react';

import { UnreachableCaseError } from '@math-blocks/core';
import { SceneGraph } from '@math-blocks/typesetter';
import * as OpenType from '@math-blocks/opentype';

import { lerpPath } from './lerp';
import {
  FontNamer,
  GlyphRegistryContext,
  sanitizeFamily,
  useIsClient,
  useIsomorphicLayoutEffect,
} from './glyph-defs';

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

// A font's glyph outlines never change, so each glyph's path string is built
// once per font and reused by every render and every renderer.
// oxlint-disable-next-line math-blocks/prefer-readonly-type -- a cache, filled in by getPath
const pathCache = new WeakMap<OpenType.Font, Map<number, string>>();

const getPath = (font: OpenType.Font, glyphID: number): string => {
  let paths = pathCache.get(font);
  if (!paths) {
    paths = new Map();
    pathCache.set(font, paths);
  }
  let d = paths.get(glyphID);
  if (d === undefined) {
    // The glyph's path is in font units.
    d = svgPathFromFontPath(font.getGlyph(glyphID).path);
    paths.set(glyphID, d);
  }
  return d;
};

// Glyph IDs are only unique within a font, so definitions are keyed by font
// plus glyph ID. FontNamer gives each font a readable name for the IDs.
type GlyphDefIds = {
  // The prefix for the IDs of the glyph definitions this SVG uses: its own,
  // or the GlyphDefsProvider's. It comes from React's useId() so that two
  // renderers, or two providers, on the same page can't collide.
  readonly prefix: string;
  // The name used in definition IDs for each font.
  readonly fontNames: ReadonlyMap<OpenType.Font, string>;
};

// Translations are in pixels, so rounding them to a thousandth of a pixel
// changes nothing visible and keeps values like 68.01599999999999 out of the
// markup. Scales aren't rounded: a glyph's scale is about 0.01-0.1, where
// rounding would change its size.
const round = (value: number): number => Math.round(value * 1000) / 1000;

const translate = (x: number, y: number): string =>
  `translate(${round(x)},${round(y)})`;

// Glyph outlines are in font units with y pointing up; this places one at
// (x, y) in the scene, scaled to its size.
const glyphTransform = (x: number, y: number, scale: number): string =>
  `${translate(x, y)} scale(${scale},${-scale})`;

// Only pending glyphs are dimmed. Every other glyph gets no style at all,
// rather than an inline `opacity: 1`.
const PENDING_STYLE: React.CSSProperties = { opacity: 0.5 };

const getGlyphKey = (
  glyph: SceneGraph.Glyph['glyph'],
  fontNames: ReadonlyMap<OpenType.Font, string>,
): string => {
  const name =
    fontNames.get(glyph.fontData.font) ??
    sanitizeFamily(glyph.fontData.fontFamily);
  return `${name}-${glyph.glyphID}`;
};

const getGlyphDefId = (prefix: string, key: string): string =>
  `${prefix}-${key}`;

type GlyphDef = {
  readonly key: string;
  readonly d: string;
};

// Returns the distinct glyphs used by the given nodes (and their descendants),
// in the order they're first drawn, so that each outline is only stored once.
// `fontNamer` names each font; see FontNamer.
const getGlyphDefs = (
  nodes: readonly SceneGraph.Node[],
  fontNamer: FontNamer,
): readonly GlyphDef[] => {
  const defs = new Map<string, GlyphDef>();

  const visit = (node: SceneGraph.Node): void => {
    switch (node.type) {
      case 'char': {
        if (node.glyph.placeholder) {
          // Placeholders draw their own "?" mark; see PlaceholderGlyph.
          return;
        }
        fontNamer.name(node.glyph.fontData);
        const key = getGlyphKey(node.glyph, fontNamer.fontNames);
        if (!defs.has(key)) {
          const { font } = node.glyph.fontData;
          const d = getPath(font, node.glyph.glyphID);
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

// The scene is drawn by plain functions that return elements, rather than one
// component per node, so React creates a fiber for each SVG element and none
// for wrappers around them. Each function passes its element exactly the
// attributes it needs. See
// https://github.com/math-blocks/math-blocks/issues/849.

const elementId = (id: number | undefined): string | undefined =>
  typeof id !== 'undefined' ? String(id) : undefined;

// Draws a glyph the font couldn't provide as a rounded box with a "?" in it.
const drawPlaceholderGlyph = (
  node: SceneGraph.Glyph,
  placeholder: OpenType.GlyphMetrics,
  key: string,
): React.ReactElement => {
  const { x, y, glyph, style } = node;
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
      key={key}
      id={elementId(glyph.id)}
      style={glyph.pending ? PENDING_STYLE : undefined}
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
        d={getPath(font, glyph.glyphID)}
        transform={glyphTransform(markX, markY, markScale)}
      />
    </g>
  );
};

const drawGlyph = (
  node: SceneGraph.Glyph,
  key: string,
  ids: GlyphDefIds,
): React.ReactElement => {
  const { x, y, glyph, style } = node;
  if (glyph.placeholder) {
    return drawPlaceholderGlyph(node, glyph.placeholder, key);
  }

  const { font } = glyph.fontData;
  const scale = glyph.size / font.head.unitsPerEm;

  // Always uses paths since browsers do weird things to glyphs when rendering
  // them in <text> elements. The outline itself lives in the SVG's <defs>;
  // fill and opacity set here apply to the referenced path.
  return (
    <use
      key={key}
      fill={style.fill}
      id={elementId(glyph.id)}
      style={glyph.pending ? PENDING_STYLE : undefined}
      aria-hidden="true"
      href={`#${getGlyphDefId(ids.prefix, getGlyphKey(glyph, ids.fontNames))}`}
      transform={glyphTransform(x, y, scale)}
    />
  );
};

const drawInterpolatedGlyph = (
  node: SceneGraph.InterpolatedGlyph,
  key: string,
): React.ReactElement => {
  const { x, y, interpolatedGlyph, amount, style } = node;
  const { font } = interpolatedGlyph.fontData; // glyph1 and glyph2 should have the same font
  const scale = interpolatedGlyph.size / font.head.unitsPerEm; // glyph1 and glyph2 should have the same size

  const { path: path1 } = font.getGlyph(interpolatedGlyph.glyphID1);
  const { path: path2 } = font.getGlyph(interpolatedGlyph.glyphID2);

  const path = lerpPath(path1, path2, amount);

  // Always uses paths since browsers do weird things to glyphs when rendering
  // them in <text> elements.
  return (
    <path
      key={key}
      fill={style.fill}
      id={elementId(interpolatedGlyph.id)}
      style={interpolatedGlyph.pending ? PENDING_STYLE : undefined}
      aria-hidden="true"
      d={svgPathFromFontPath(path)}
      transform={glyphTransform(x, y, scale)}
    />
  );
};

const drawLine = (node: SceneGraph.Line, key: string): React.ReactElement => (
  <line
    key={key}
    x1={node.x1}
    y1={node.y1}
    x2={node.x2}
    y2={node.y2}
    className={node.className}
    stroke={node.style.stroke || 'currentColor'}
    strokeWidth={node.thickness}
    strokeLinecap="butt"
  />
);

// A rect's `style` is a fill and stroke given as CSS, which the hitboxes use.
// Every rect is drawn without an outline stroke of its own.
const drawRect = (node: SceneGraph.Rect, key: string): React.ReactElement => (
  <rect
    key={key}
    x={node.x}
    y={node.y}
    width={node.width}
    height={node.height}
    style={node.style}
    className={node.className}
    fill={node.fill}
    stroke="none"
  />
);

const drawGroup = (
  node: SceneGraph.Group,
  key: string | undefined,
  ids: GlyphDefIds,
): React.ReactElement => (
  <g
    key={key}
    transform={translate(node.x, node.y)}
    style={node.style.stroke ? { color: node.style.stroke } : undefined}
    id={elementId(node.id)}
  >
    {node.children.map((child, i) => drawNode(child, child.key || `${i}`, ids))}
  </g>
);

const drawNode = (
  node: SceneGraph.Node,
  key: string,
  ids: GlyphDefIds,
): React.ReactElement => {
  switch (node.type) {
    case 'char':
      return drawGlyph(node, key, ids);
    case 'interpolated':
      return drawInterpolatedGlyph(node, key);
    case 'group':
      return drawGroup(node, key, ids);
    case 'line':
      return drawLine(node, key);
    case 'rect':
      return drawRect(node, key);
    default:
      throw new UnreachableCaseError(node);
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
  const ownPrefix = `mb${React.useId().replace(/:/g, '')}`;

  // Under a GlyphDefsProvider, on the client, the definitions go in the
  // provider's hidden <svg>. Otherwise, including on the server, this SVG
  // keeps its own <defs> so that it works on its own.
  const registry = React.useContext(GlyphRegistryContext);
  const isClient = useIsClient();
  const shared = registry !== null && isClient ? registry : null;

  const fontNamer = shared ? shared.fontNamer : new FontNamer();
  const prefix = shared ? shared.prefix : ownPrefix;
  const glyphDefs = getGlyphDefs(
    showHitboxes
      ? [scene.selection, scene.content, scene.hitboxes]
      : [scene.selection, scene.content],
    fontNamer,
  );
  const { fontNames } = fontNamer;

  useIsomorphicLayoutEffect(() => {
    // Adding definitions that are already there does nothing, so this only
    // updates the hidden <svg> when this SVG uses a glyph for the first time.
    shared?.add(
      glyphDefs.map(({ key, d }) => ({ id: getGlyphDefId(prefix, key), d })),
    );
  });

  const ids: GlyphDefIds = { prefix, fontNames };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width + CURSOR_WIDTH}
      height={height}
      style={style}
      ref={ref}
    >
      {!shared && glyphDefs.length > 0 && (
        <defs>
          {glyphDefs.map(({ key, d }) => (
            <path key={key} id={getGlyphDefId(prefix, key)} d={d} />
          ))}
        </defs>
      )}
      <g fill="currentColor" stroke="none" transform={translate(0, yAdjust)}>
        {drawGroup(scene.selection, undefined, ids)}
        {/**
         * We set 'fill' and stroke to 'currentColor' so that the base
         * color is whatever the current CSS 'color' property is set up.
         * Individual nodes within the scene can override their style's
         * color and the render above will set the fill and/or stroke in
         * rendered SVG element appropriately.
         */}
        {drawGroup(scene.content, undefined, ids)}
      </g>
      {showHitboxes && drawGroup(scene.hitboxes, undefined, ids)}
    </svg>
  );
});

SceneRenderer.displayName = 'SceneRenderer';

export default SceneRenderer;
