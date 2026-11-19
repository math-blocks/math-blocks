# @math-blocks/opentype

## 0.0.14

### Patch Changes

- 7d29fdc: Add `repository`, `bugs` and `homepage` to `package.json`, so npm links to the source and the issue tracker.

## 0.0.13

### Patch Changes

- 295c78a: Fix `parse` reading negative 2-byte integers in CFF Top and Private DICTs as large positive numbers. For example, a subset of STIX Two Math reported a `FontBBox` of `[-978, 63895, 3072, 2627]` instead of `[-978, -1641, 3072, 2627]`.
