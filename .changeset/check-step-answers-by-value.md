---
'@math-blocks/tutor': minor
---

`checkStep` compares numeric answers by their exact values, however they're written, so `2x + 5 = 10 -> x = 2.5` and `x + 3 = 5 -> x = 4/2` are now `'equivalent'`. Answers that aren't numeric are compared as written, as before.

An `'equivalent'` result has a new `simplified` field that says whether `next` is a finished answer in simplest form (see `util.isSimplifiedNumber` in `@math-blocks/semantic`): `x = 2.5` and `x = 5/2` are simplified, while `x = 5 * 1/2`, `x = 10/4` and `2x = 5` aren't. Callers can use it to accept a correct step but still ask for the answer to be simplified. Answers that aren't numbers, such as `5x`, aren't considered simplified yet.
