---
'@math-blocks/semantic': patch
---

Fix the published types referencing `OneOrMore` and `TwoOrMore` without declaring them. Projects with `skipLibCheck: false` got "Cannot find name" errors, and with `skipLibCheck: true` those types became `any`, so `args` on sums, products, equations and other n-ary nodes went unchecked. The types now import them from `@math-blocks/core`.
