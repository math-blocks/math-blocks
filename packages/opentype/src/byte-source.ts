/**
 * The bytes of a font file, or of part of one. The parser only needs to cut
 * out a range and read it, so a Blob (in browsers or Node) fits, and so does
 * an ArrayBuffer wrapped with `fromArrayBuffer`.
 *
 * Keeping the parser off the Blob type means it works wherever there's an
 * ArrayBuffer: jsdom's Blob has no `arrayBuffer()`, and importing Blob from
 * Node's 'buffer' module makes bundlers add a polyfill that breaks browsers.
 */
export type ByteSource = {
  readonly size: number;
  // Like Blob.slice: `end` defaults to the end of the data.
  readonly slice: (start: number, end?: number) => ByteSource;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
};

/** Wraps an ArrayBuffer so the parser can read it like a Blob. */
export const fromArrayBuffer = (buffer: ArrayBuffer): ByteSource => ({
  size: buffer.byteLength,
  slice: (start, end) => fromArrayBuffer(buffer.slice(start, end)),
  arrayBuffer: async () => buffer,
});
