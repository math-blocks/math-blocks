---
'@math-blocks/tutor': minor
---

`checkStep` takes an options argument, `{answers: 'simplified' | 'value'}`, which sets how the two steps' solved answers are compared.

- `'simplified'`, the default, compares numeric answers by their exact values and also requires the answer in `next` to be in simplest form (see `util.isSimplifiedNumber` in `@math-blocks/semantic`). So `2x + 5 = 10 -> x = 2.5` and `-> x = 5/2` are now `'equivalent'`, while `-> x = 5 * 1/2` and `-> x = 10/4` are `'not-equivalent'`.
- `'value'` compares numeric answers by value only, so `x = 5 * 1/2` and `x = 10/4` are `'equivalent'` too.

With either option, answers that aren't numeric are compared as written, as before. `CheckStepOptions` and `AnswerComparison` are exported too.
