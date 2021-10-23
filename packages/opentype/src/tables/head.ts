export type HeaderTable = {
  readonly majorVersion: number; // uint16
  readonly minorVersion: number; // uint16
  readonly fontRevision: number; // signed fixed-point number 16.16
  readonly checksumAdjustment: number; // uint32
  readonly magicNumber: number; // uint32
  readonly flags: number; // uint16
  readonly unitsPerEm: number; // uint16
  readonly created: number; // BigInt; // LONGDATETIME
  readonly modified: number; // BigInt; // LONGDATETIME
  readonly xMin: number; // int16
  readonly yMin: number; // int16
  readonly xMax: number; // int16
  readonly yMax: number; // int16
  readonly macStyle: number; // uint16 - bitfield
  readonly lowestRecPPEM: number; // uint16
  readonly fontDirectionHint: number; // int16
  readonly indexToLocFormat: number; // int16
  readonly glyphDataFormat: number; // int16
};

export const parseHead = async (blob: Blob): Promise<HeaderTable> => {
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);

  const table: HeaderTable = {
    majorVersion: view.getUint16(0),
    minorVersion: view.getUint16(2),
    fontRevision: 0, // TODO: parse signed fixed-point number 16.16
    checksumAdjustment: view.getUint32(8),
    magicNumber: view.getUint32(12),
    flags: view.getUint16(16),
    unitsPerEm: view.getUint16(18),
    created: 0, // view.getBigInt64(20), // LONGDATETIME
    modified: 0, // view.getBigInt64(28), // LONGDATETIME
    xMin: view.getInt16(36),
    yMin: view.getInt16(38),
    xMax: view.getInt16(40),
    yMax: view.getInt16(42),
    macStyle: view.getUint16(44),
    lowestRecPPEM: view.getUint16(46),
    fontDirectionHint: view.getUint16(48),
    indexToLocFormat: view.getUint16(50),
    glyphDataFormat: view.getUint16(52),
  };

  return table;
};
