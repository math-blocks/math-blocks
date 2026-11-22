// Shared glyph definitions: one hidden <svg> holds the outline of each glyph
// used anywhere on the page, and every renderer and editor draws its glyphs
// with <use> elements that reference it. See
// https://github.com/math-blocks/math-blocks/issues/758.
import * as React from 'react';

import * as OpenType from '@math-blocks/opentype';

// The name is used as part of an XML ID, so anything other than letters,
// digits, '-' and '_' is replaced.
export const sanitizeFamily = (family: string): string =>
  family.replace(/[^A-Za-z0-9_-]/g, '_');

/**
 * Names fonts for use in glyph definition IDs. A font is named by its family,
 * which keeps IDs readable and stable across renders, unless a different font
 * already has that name, either because both have the same family or because
 * their families sanitize to the same string. Then it gets the first free name
 * of the form `<family>-2`, `<family>-3` and so on, so two fonts never share a
 * definition.
 */
export class FontNamer {
  private readonly names = new Map<OpenType.Font, string>();
  private readonly used = new Set<string>();

  get fontNames(): ReadonlyMap<OpenType.Font, string> {
    return this.names;
  }

  // Naming is idempotent: a font keeps the name it got first.
  name(fontData: OpenType.FontData): string {
    const existing = this.names.get(fontData.font);
    if (existing !== undefined) {
      return existing;
    }
    const family = sanitizeFamily(fontData.fontFamily);
    let name = family;
    for (let i = 2; this.used.has(name); i++) {
      name = `${family}-${i}`;
    }
    this.names.set(fontData.font, name);
    this.used.add(name);
    return name;
  }
}

export type GlyphPath = {
  readonly id: string;
  readonly d: string;
};

/**
 * The glyph definitions shared by every renderer under a GlyphDefsProvider.
 *
 * It's an external store rather than React state, so that adding a glyph only
 * re-renders the hidden <svg> that holds the definitions, never the renderers
 * and editors that use them. Definitions are never removed: the glyphs a page
 * can use are bounded by its fonts, and keeping them avoids tracking which
 * renderers still use each one.
 */
export class GlyphRegistry {
  readonly prefix: string;
  readonly fontNamer = new FontNamer();
  private readonly paths = new Map<string, string>();
  // Replaced, not mutated, whenever a definition is added, as
  // useSyncExternalStore requires.
  // eslint-disable-next-line functional/prefer-readonly-type
  private snapshot: readonly GlyphPath[] = [];
  private readonly listeners = new Set<() => void>();

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /** Adds the given definitions, skipping any that are already there. */
  add(paths: readonly GlyphPath[]): void {
    let added = false;
    for (const { id, d } of paths) {
      if (!this.paths.has(id)) {
        this.paths.set(id, d);
        added = true;
      }
    }
    if (added) {
      this.snapshot = Array.from(this.paths, ([id, d]) => ({ id, d }));
      this.listeners.forEach((listener) => listener());
    }
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): readonly GlyphPath[] => this.snapshot;
}

const NO_PATHS: readonly GlyphPath[] = [];
const getServerSnapshot = (): readonly GlyphPath[] => NO_PATHS;

export const GlyphRegistryContext = React.createContext<GlyphRegistry | null>(
  null,
);

// Zero-size and out of the layout, but still rendered: some browsers don't
// resolve references to gradients, clip paths, masks and filters inside a
// `display: none` element, so this avoids relying on it for paths too.
const HIDDEN_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 0,
  height: 0,
  overflow: 'hidden',
};

const SharedGlyphDefs = ({
  registry,
}: {
  readonly registry: GlyphRegistry;
}): React.ReactElement => {
  const paths = React.useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    getServerSnapshot,
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={HIDDEN_STYLE}
    >
      <defs>
        {paths.map(({ id, d }) => (
          <path key={id} id={id} d={d} />
        ))}
      </defs>
    </svg>
  );
};

type ProviderProps = {
  readonly children?: React.ReactNode;
};

/**
 * Shares glyph definitions between every MathRenderer and MathEditor inside
 * it: the outline of each glyph is stored once, in one hidden <svg>, instead
 * of once in each renderer's SVG. Put it near the root of a page with lots of
 * math on it.
 *
 * Without a provider, and when rendering on the server, each SVG keeps its own
 * <defs>, so that it works on its own.
 *
 * The hidden <svg> and the renderers must be in the same document tree: IDs
 * don't resolve across a shadow root.
 */
export const GlyphDefsProvider = ({
  children,
}: ProviderProps): React.ReactElement => {
  const id = React.useId();
  const [registry] = React.useState(
    () => new GlyphRegistry(`mb${id.replace(/:/g, '')}`),
  );
  return (
    <GlyphRegistryContext.Provider value={registry}>
      <SharedGlyphDefs registry={registry} />
      {children}
    </GlyphRegistryContext.Provider>
  );
};

const subscribeToNothing = (): (() => void) => () => undefined;

/**
 * Whether this render is on the client. It's false on the server and during
 * hydration, so hydration sees the same markup the server sent, then true.
 */
export const useIsClient = (): boolean =>
  React.useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

// useLayoutEffect, which runs before the browser paints, so a glyph's
// definition is in place by the time its <use> is shown. React warns about
// useLayoutEffect on the server, where effects don't run anyway.
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
