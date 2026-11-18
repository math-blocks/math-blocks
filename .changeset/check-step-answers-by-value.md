---
'@math-blocks/tutor': minor
---

`checkStep` takes an options argument, `{answers: 'value' | 'form'}`. With `'value'`, the new default, numeric answers are compared by their exact values, so `x + 3 = 5 -> x = 4/2` and `2x + 5 = 10 -> x = 2.5` are now `'equivalent'`. Pass `{answers: 'form'}` to keep the old behavior, which compares answers as written. `CheckStepOptions` and `AnswerComparison` are exported too.
