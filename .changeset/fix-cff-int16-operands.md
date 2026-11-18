---
'@math-blocks/opentype': patch
---

Fix `parse` reading negative 2-byte integers in CFF Top and Private DICTs as large positive numbers. For example, a subset of STIX Two Math reported a `FontBBox` of `[-978, 63895, 3072, 2627]` instead of `[-978, -1641, 3072, 2627]`.
