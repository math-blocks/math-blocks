# 06 Diagnosing Mistakes

This chapter catalogs the algebra errors students commonly make, from pre-algebra through Algebra 1, according to the research. It then proposes how `@math-blocks/tutor` could name the mistake when `checkStep` reports a step as `'not-equivalent'`.

It follows on from [Checking work](05_checking_work.md). That chapter describes the old rule-search grader, which could name a few mistakes. PR [#693](https://github.com/math-blocks/math-blocks/pull/693) replaces it with a `checkStep` that runs the solver on both steps and compares the solutions. That design accepts any valid step, but it can't say what went wrong.

The motivating example is a student who forgets to distribute when dividing both sides of an equation: `2(x + 3) = 10 → 2x + 3 = 5`.

> **Status:** proposal. Written against branch `claude/loving-hawking-2to3yb` (PR [#693](https://github.com/math-blocks/math-blocks/pull/693)) at `48967de`, November 2026. `checkStep` and `packages/tutor/src/check/` exist only on that branch until it merges.

## Summary

1.  **Keep `checkStep` as the judge and add a separate `diagnoseMistakes(prev, next)`.** Call it only after a `'not-equivalent'` result. It returns a ranked list of diagnoses, and an empty list means "wrong, cause unknown". It never changes whether a step is accepted.
2.  **Use mal-rules as the core, matched by running the solver.** Apply each buggy rule wherever it matches in `prev`, optionally after one correct step. Then compare the result to `next` with `checkStep`'s own comparison. A match means the student made that mistake and then took only valid steps, whatever those steps were. Students may take any valid step, including ones that don't help, so the plan never requires `next` to look like the buggy result. Structural similarity only breaks ties. Mal-rules are `Rule`s flagged as mistakes, so they reuse the rewrite engine's paths and `Step.before` for highlighting.
3.  **The motivating example needs one correct step before the mistake.** `2(x + 3) = 10 → 2x + 3 = 5` is best explained as a correct distribution to `2x + 6 = 10`, then dividing both sides by 2 but dividing only the last term on the left. No single buggy rule applied to `prev` produces it. So the search must allow one valid step before the mistake ([#657](https://github.com/math-blocks/math-blocks/issues/657)'s `nextSteps`).
4.  **Start with five mal-rules** that are common in the research, local, and easy to match: moving a term without changing its sign; doing an operation to only one term of a side; distributing to the first term only (including negatives); combining unlike terms; and not flipping an inequality.
5.  **Check solution sets before trying any mal-rule.** Multiplying both sides by an expression with x in it, or squaring both sides, adds a solution. Dividing by one loses a solution. The algebra in these steps is usually done right; the trouble is what the operation does to the solutions. Comparing the two solution sets catches them without a mal-rule: a superset means a solution was added, a strict subset means one was lost. The check still works after any valid steps, and the solution that changed points at the factor responsible. It needs the solver to handle `x² = c`, `x² − bx = 0` and x in a denominator first.
6.  **Ambiguity on equations can't be avoided.** A valid step on an equation keeps only its solutions. So once students may take any valid step after a mistake, a linear equation's answer is all the information left, and two mistakes that give the same answer can't be told apart from `next`. Return every mistake that fits, rank them by how common each is, and let the UI hedge or ask when they disagree. Expressions don't have this problem: two mistakes rarely produce the same polynomial.

## Where the code is today

### The new `checkStep`

`packages/tutor/src/check/check-step.ts` solves or simplifies both steps with `@math-blocks/solver` and compares the answers with `canonicalKey`, which ignores term order, implicit multiplication, which side is which, flipped inequalities and root order. A `'not-equivalent'` result carries `prevAnswer` and `nextAnswer`, which is all a diagnoser gets today.

Running 31 student steps through it showed that every wrong step in the catalog's first-priority set came back `'not-equivalent'` with sensible answers. For example:

| prev → next                   | status         | prevAnswer \| nextAnswer             |
|-------------------------------|----------------|--------------------------------------|
| `2(x + 3) = 10 → 2x + 3 = 5`  | not-equivalent | x = 2 \| x = 1                       |
| `2x + 6 = 10 → 2x = 16`       | not-equivalent | x = 2 \| x = 8                       |
| `5 − (x + 2) → 5 − x + 2`     | not-equivalent | 3 − x \| 7 − x                       |
| `−2x < 6 → x < −3`            | not-equivalent | x \> −3 \| x \< −3                   |
| `x² · x³ → x⁶`                | not-equivalent | x⁵ \| x⁶                             |
| `(x − 2)(x + 3) = 0 → x = −2` | not-equivalent | x = 2, x = −3 \| x = −2              |
| `x² = 2x → x = 2`             | unknown        | the solver can't solve `x² − 2x = 0` |
| `(x + 1)² → x² + 2x + 1`      | not-equivalent | (x + 1)² \| x² + 2x + 1              |

> **Bug found:** the last row is a valid step that `checkStep` rejects. The solver's simplify never expands a power of a sum, so `(x + 1)²` never reaches the same form as its expansion. (`(x + 1)(x + 2) → x² + 3x + 2` works.) It blocks the `(a + b)² → a² + b²` mal-rule and is worth fixing on its own. It's listed as a Phase 0 bug in the rollout below. The `x² = 2x` row is a solver limitation that correctly returns `'unknown'`, but it blocks diagnosing "divided by x and lost a root".
>
> The same limitation affects `x² = 9`, `x² = 4` and `1/x = 2`. The solver can't solve a quadratic missing its linear or constant term, or an equation with x in a denominator. These are the textbook forms of the solution-set mistakes (category J), so the solver needs to handle them before those mistakes can be diagnosed.

### The old grader's mistake detection

`git show 869b363 -- packages/tutor/src/grader` shows eight `MistakeId`s, detected as side effects of the forward rule search:

| MistakeId               | Check                  | What it caught                                                                               | Priority |
|-------------------------|------------------------|----------------------------------------------------------------------------------------------|----------|
| EQN_ADD_DIFF            | equation-checks        | Different terms added to each side: `x = y → x + 3 = y + 7`                                  | 10       |
| EQN_MUL_DIFF            | equation-checks        | Sides multiplied by different factors                                                        | 10       |
| EXPR_ADD_NON_IDENTITY   | axiom-checks           | A non-zero term appeared out of nowhere                                                      | 5        |
| EXPR_MUL_NON_IDENTITY   | axiom-checks           | A factor other than 1 appeared out of nowhere                                                | 5        |
| EVAL_ADD / EVAL_MUL     | eval-checks            | Arithmetic slip in the numeric terms or factors, with a `Correction` giving the right number | 1        |
| DECOMP_ADD / DECOMP_MUL | eval-checks (reversed) | A number split into parts that don't add or multiply back to it                              | 1        |

Each `Mistake` carried `prevNodes`, `nextNodes` and `corrections` (a node id and its replacement). `filterMistakes` kept only mistakes whose nodes really were in `prev` or `next`, removed duplicates, and kept the highest-priority group. Three ideas are worth keeping:

- Point at nodes by id in both trees, so the editor can highlight them. The old `math-editor.tsx` refreshed on every keystroke so that highlights would not use stale nodes.
- Carry a correction: what the student should have written.
- Rank by specificity: an equation-level explanation beats an arithmetic slip.

Its weaknesses are the reasons it was replaced. It detected mistakes only where a correct check happened to fail partway through, so it could not name any conceptual error in the catalog below: not partial distribution, not sign errors, not conjoining. It also relied on a costly bidirectional search.

### The rewrite engine and the open issues

- `packages/solver/src/rewrite/types.ts` defines `Rule` (`id` plus `apply(node, context) → Iterable<Step>`), `Strategy`, lazy `Trace`s and `StepBranch.path`, the ancestors of `step.before`. The README already names diagnosis ([#660](https://github.com/math-blocks/math-blocks/issues/660)) and combined-step search ([#661](https://github.com/math-blocks/math-blocks/issues/661)) as reasons traces enumerate every alternative. Only `trace.ts` and the types exist so far. No rules or strategies are written yet.
- **[#659](https://github.com/math-blocks/math-blocks/issues/659) Initial mistake rules** proposes about five buggy rules, "excluded from normal strategies by construction", and warns that the set can explode.
- **[#660](https://github.com/math-blocks/math-blocks/issues/660) Diagnose a student step** already says validity comes only from the math check, and that an invalid step is classified as "mistake" (matching a mistake rule) or "invalid".
- **[#661](https://github.com/math-blocks/math-blocks/issues/661) Combined steps** proposes searching short rule sequences and, for invalid steps, including mistake rules while preferring as few as possible. It cites van der Hoek, Jeuring & Bos (2025), who diagnosed 29.4% of combined steps this way.
- **[#635](https://github.com/math-blocks/math-blocks/issues/635)** plans an exact-rational evaluator with `areEquivalent` and `haveSameSolutions`. Today `Semantic.util.evalNode` handles numbers only, with no variables and no powers.
- **[#657](https://github.com/math-blocks/math-blocks/issues/657)** plans `nextSteps` and `nextStep`, which the one-correct-step prefix in this plan depends on.
- **[#654](https://github.com/math-blocks/math-blocks/issues/654)** splits `distribute` and friends into small rules. Mal-rules are easiest to write as small rules of the same size, such as "multiply each term" versus "multiply the first term only".

This plan is a concrete design for the "mistake" half of [#660](https://github.com/math-blocks/math-blocks/issues/660) and [#661](https://github.com/math-blocks/math-blocks/issues/661). It doesn't compete with them.

## Part 1 · Common algebra errors in the research

The catalog covers pre-algebra through Algebra 1: the level the solver handles. Errors are grouped by where they happen. The *Evidence* column says what the sources report about how common each error is, and how well it could be checked.

> **How firm the sources are.** The literature survey was done from search-engine results only. No full-text PDF was read. Claims rest on abstracts, snippets and secondary citations.
>
> *\[verified\]* means the claim or number appeared in a source snippet. *\[unverified\]* means it comes from memory or an indirect citation and should be checked before quoting. Few studies publish per-error rates for these exact items. "Documented" without a number means the error is a standard example in the cited work, with no rate seen.

### What the evidence supports most firmly

- **Negative-sign errors are the most frequent and most persistent category.** Booth, Barbieri, Eyer & Paré-Blagoev (2014) coded U.S. Algebra I students' work in six categories (variables, negative signs, equality/inequality, operations, fractions, properties). Negative-sign errors were the most common in every topic, and they outlasted the others through the year. Students who still made negative-sign and equality errors at year's end scored significantly lower on standardized tests. *\[verified, qualitative\]*
- **Students with negative-sign misconceptions also learn less from a tutor** (Booth & Koedinger, 2008, with the Cognitive Tutor). *\[verified\]*
- **A few mal-rules cause most errors, and which ones varies by school.** Payne & Squibb (1990) diagnosed 1,097 error protocols from 96 students aged 13–14. They found heavily skewed mal-rule use, different dominant mal-rules in different schools, and several common mal-rules that hadn't been reported before. *\[verified N and findings\]* *\[per-rule table not seen\]*
- **Reading "=" as "do something" predicts trouble with equations.** Knuth et al. (2006, N = 177, grades 6–8) linked a relational reading of the equal sign to success solving equations. In a companion paper, relational definitions rose from 29% in grade 6 to 46% in grade 8 (Knuth et al., 2008). *\[verified\]*
- **Over-generalized linearity is the common thread behind many errors**, such as `(a + b)² → a² + b²`, `√(a + b) → √a + √b` and `1/(a + b) → 1/a + 1/b`. Matz (1982) explains these as extrapolations of known rules, and Kirshner & Awtry (2004) as visual salience. *\[verified, qualitative\]*
- **Buggy messages alone may not help.** In ASSISTments, Selent & Heffernan (2015) found that messages for expected wrong answers on one-step equations did no better than ordinary hints. Students seldom repeated the same wrong answer. Other work found that the common wrong answers stay stable across five years of different students. *\[verified\]* This matters for how the tutor uses a diagnosis (see the open questions).

### A · Distribution

| \#  | Error                                                                         | Student step                                        | Evidence                                                                                                                           |
|-----|-------------------------------------------------------------------------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| A1  | **Partial distribution.** Multiplies only the first term inside the brackets. | `2(x + 3) → 2x + 3` · `2(x + 3) = 10 → 2x + 3 = 10` | Classic mal-rule in Sleeman (1984, 1985) and Payne & Squibb (1990). Coded under "properties" by Booth et al. (2014). No rate seen. |
| A2  | **Negative not distributed to every term.** A sign error inside distribution. | `−(x − 4) → −x − 4` · `5 − 2(x + 1) → 5 − 2x + 2`   | Part of the negative-sign category, the most persistent in Booth et al. (2014). *\[verified, qualitative\]*                        |
| A3  | **Distributing over a product.**                                              | `2(3x) → 6 · 2x`                                    | Over-generalized distribution in Matz (1982) and Sleeman (1984).                                                                   |
| A4  | **Exponent "distributed" over a sum.**                                        | `(x + 2)² → x² + 4`                                 | Matz (1982); Kirshner & Awtry (2004). Booth et al. (2014) use this exact example. *\[verified\]*                                   |
| A5  | **Subtracting a bracketed expression.** Only the first term is subtracted.    | `(3x + 2) − (x + 5) → 2x + 7`                       | Negative-sign and detachment family. See B1.                                                                                       |

### B · Sign and negative errors

| \#  | Error                                                                | Student step                                      | Evidence                                                                                                                            |
|-----|----------------------------------------------------------------------|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| B1  | **Detaching the minus sign** from the term it belongs to.            | `7 − 3x + 2x → 7 − 5x`                            | Herscovics & Linchevski (1994) call it "detachment". Vlassis (2004) describes the three meanings of the minus sign students mix up. |
| B2  | **Moving a term across "=" without changing its sign.**              | `x + 3 = 5 → x = 5 + 3` · `2x + 6 = 10 → 2x = 16` | Standard mal-rule in Sleeman (1984) and Payne & Squibb (1990). Included in Booth et al.'s negative-sign and equality categories.    |
| B3  | **"Change sides, change sign" applied to a coefficient.**            | `3x = 12 → x = 12 − 3` · `3x = 12 → x = −12/3`    | Commentary on Payne & Squibb (1990) blames this shortcut for many errors. *\[snippet\]*                                             |
| B4  | **Dropping a negative** when dividing or moving terms.               | `−2x = 8 → x = 4`                                 | The most frequent category in Booth et al. (2014). *\[verified\]*                                                                   |
| B5  | **Precedence of the unary minus with a power.**                      | `−3² → 9`                                         | Reported to persist into college. *\[source not read\]*                                                                             |
| B6  | **Integer sign rules mixed up** between addition and multiplication. | `−4 + (−6) → 10` · `−3 · −2 → −6`                 | Reviewed as an algebra prerequisite by Bush & Karp (2013).                                                                          |

### C · Combining like terms

| \#  | Error                                                                 | Student step                            | Evidence                                                                                                                      |
|-----|-----------------------------------------------------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| C1  | **Conjoining unlike terms.** The urge to "finish" an open expression. | `2x + 3 → 5x` · `2x + 6 = 10 → 8x = 10` | Tirosh, Even & Robinson (1998); Küchemann (1981); Booth et al. (2014, "variables"). Widely described as common. No rate seen. |
| C2  | **Combining unlike powers.**                                          | `3x + 2x² → 5x³`                        | Mal-rule in Sleeman (1985) and Payne & Squibb (1990).                                                                         |
| C3  | **Sum and product swapped.**                                          | `x + x → x²` · `x · x → 2x`             | Matz (1982); Sleeman (1984). Eedi has misconception items for this.                                                           |
| C4  | **Losing an implicit coefficient of 1.**                              | `5x − x → 5`                            | "Letter ignored" interpretation (Küchemann, 1981).                                                                            |

### D · Fraction operations

| \#  | Error                                      | Student step                                       | Evidence                                                                                                        |
|-----|--------------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| D1  | **Cancelling a term instead of a factor.** | `(x + 2)/2 → x + 1` or `x` · `(x + 6)/(x + 3) → 2` | A standard example of a salient but restricted rule (Kirshner & Awtry, 2004). Booth et al. (2014, "fractions"). |
| D2  | **Dividing only one term of a sum.**       | `(2x + 4)/2 → x + 4`                               | The fraction form of F2.                                                                                        |
| D3  | **Adding numerators and denominators.**    | `1/2 + 1/3 → 2/5`                                  | Carried over from arithmetic (Ashlock, *Error Patterns in Computation*). *\[not checked\]*                      |
| D4  | **Splitting a sum in the denominator.**    | `1/(a + b) → 1/a + 1/b`                            | Linearity over-generalization (Matz, 1982).                                                                     |

### E · Exponent rules

| \#  | Error                                                              | Student step                  | Evidence                                                        |
|-----|--------------------------------------------------------------------|-------------------------------|-----------------------------------------------------------------|
| E1  | **Multiplying exponents in a product.**                            | `x² · x³ → x⁶`                | A classic mal-rule (Sleeman; Matz). No rate seen.               |
| E2  | **Adding exponents for a power of a power, or multiplying bases.** | `(x²)³ → x⁵` · `2³ · 2² → 4⁵` | Same family as E1.                                              |
| E3  | **Coefficient inside or outside the exponent.**                    | `(3x)² → 3x²`                 | A "parsing" mal-rule in Sleeman's (1984) terms.                 |
| E4  | **Root of a sum split.**                                           | `√(x² + 9) → x + 3`           | Matz (1982); Kirshner & Awtry (2004).                           |
| E5  | **Exponent multiplied by the base.**                               | `2³ → 6`                      | Common in early algebra. Eedi has misconception items for this. |

### F · Operating on both sides of an equation

| \#  | Error                                                | Student step                                           | Evidence                                                                                                                                                         |
|-----|------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| F1  | **Wrong inverse operation.**                         | `3x = 12 → x = 9` · `x + 5 = 12 → x = 12/5`            | Core mal-rules in Sleeman (1984, 1985) and Payne & Squibb (1990). Selent & Heffernan (2015) wrote common-wrong-answer messages for exactly these. *\[verified\]* |
| F2  | **Operating on only one term of a side.**            | `2x + 6 = 10 → x + 6 = 5` · `x/2 + 3 = 5 → x + 3 = 10` | Booth et al. (2014, "equality"). Tied to the operational reading of "=" (Kieran, 1981; Knuth et al., 2006). The motivating example is in this family.                      |
| F3  | **Operating on only one side.**                      | `2(x + 3) = 10 → x + 3 = 10`                           | Same sources as F2.                                                                                                                                              |
| F4  | **Dividing the wrong way round.**                    | `6x = 3 → x = 2`                                       | "Divide the larger by the smaller" (Sleeman, 1985). *\[example not seen in a snippet\]*                                                                          |
| F5  | **Running equal sign.** "=" used to mean "and then". | `x + 3 = 7 − 3 = 4`                                    | Kieran (1981); Knuth et al. (2006); Bush & Karp (2013). Not a step the tutor can see, since each step is one relation.                                           |

### G · Inequality direction

| \#  | Error                                                            | Student step        | Evidence                                                                                                                                             |
|-----|------------------------------------------------------------------|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| G1  | **Not flipping** when multiplying or dividing by a negative.     | `−2x < 6 → x < −3`  | Tsamir, Tirosh & Almog (1998). A 2016 study of university preparatory students put it at about 5.7% of errors. *\[secondary, paper not identified\]* |
| G2  | **Flipping when it isn't needed,** e.g. for a negative constant. | `2x < −8 → x > −4`  | Documented over-generalization ("a negative anywhere means flip"). No rate seen.                                                                     |
| G3  | **Treating an inequality as an equation.**                       | `x + 2 > 5 → x = 3` | Tsamir & Bazzini (2001), with Italian and Israeli students. *\[verified, qualitative\]*                                                              |

### H · Quadratics by factoring

| \#  | Error                                             | Student step                         | Evidence                                                                                                             |
|-----|---------------------------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| H1  | **Zero-product rule with a non-zero right side.** | `(x − 2)(x + 3) = 6 → x − 2 = 6`     | Over-generalized zero-product rule (Matz, 1982). *\[from memory\]*                                                   |
| H2  | **Wrong sign on a root.**                         | `(x + 2)(x − 5) = 0 → x = 2, x = −5` | Vaiyavutjamai & Clements (2006). *\[error data not seen\]*                                                           |
| H3  | **Dividing by x and losing x = 0.**               | `x² = 3x → x = 3`                    | Moved to J3, with the other steps that change the solution set.                                            |
| H4  | **Missing ±** when taking a square root.          | `x² = 9 → x = 3`                     | Commonly listed. No rate seen. It also loses a solution, so the solution-set check catches it too. |
| H5  | **Factoring sign or pairing error.**              | `x² − x − 6 → (x − 2)(x + 3)`        | Negative-sign family (Booth et al., 2014).                                                                           |

### I · Order of operations

| \#  | Error                                                                     | Student step                       | Evidence                                                                                                                                    |
|-----|---------------------------------------------------------------------------|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| I1  | **Strict left-to-right** evaluation, or reading PEMDAS as a strict order. | `8 − 3 + 2 → 3` · `3 + 4 · 2 → 14` | Bush & Karp (2013); Booth et al. (2014, "operations"); Kieran on left-to-right processing.                                                  |
| I2  | **Arithmetic slip.** The method is right but a number is wrong.           | `2x + 5 = 12 → 2x = 6`             | Not a misconception, but the old grader's `EVAL_ADD`/`EVAL_MUL` show it was worth reporting. Payne & Squibb separated slips from mal-rules. |

### J · Steps that add or lose a solution

In these steps the algebra is usually right. The mistake is using an operation that doesn't keep the solution set: multiplying or dividing by something that can be zero, or squaring. The solution that changed points at the cause.

| \#  | Error                                                                                                       | Student step                                                                             | Evidence                                                                                                                                                                                                    |
|-----|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| J1  | **Multiplying both sides by an expression with x in it.** Adds a solution wherever that expression is zero. | `x = 3 → x · x = 3x` (adds x = 0) · `x + 1 = 4 → (x + 1)(x − 2) = 4(x − 2)` (adds x = 2) | A standard textbook warning, and one of [#635](https://github.com/math-blocks/math-blocks/issues/635)'s test cases. No research rate seen. `checkStep` rejects the second example today, giving `x = 3` vs `x = 3, x = 2`. It returns `'unknown'` for the first.    |
| J2  | **Squaring both sides.** Adds the solutions of the negated equation.                                        | `x = 2 → x² = 4` (adds x = −2)                                                           | One of [#635](https://github.com/math-blocks/math-blocks/issues/635)'s test cases. Usually met with radical equations, slightly beyond Algebra 1. `checkStep` returns `'unknown'` today.                                                                            |
| J3  | **Dividing both sides by an expression with x in it.** Loses the solutions where that expression is zero.   | `x² = 3x → x = 3` (loses x = 0) · `(x − 2)(x + 3) = 2(x − 2) → x + 3 = 2` (loses x = 2)  | Standard in teaching sources, and one of [#635](https://github.com/math-blocks/math-blocks/issues/635)'s test cases. No research rate seen. `checkStep` rejects the second example today, giving `x = 2, x = −1` vs `x = −1`. It returns `'unknown'` for the first. |
| J4  | **Missing ± when taking a square root.**                                                                    | `x² = 9 → x = 3` (loses x = −3)                                                          | Same as H4, listed here because it loses a solution. `checkStep` returns `'unknown'` today.                                                                                                                 |

> **Not always a mistake.** Multiplying by x is the standard way to clear fractions, and it's correct when x = 0 was never a solution: `1/x = 2 → 1 = 2x` keeps the solution set, so it's a valid step. Even when it does add a solution, some courses teach it as a legitimate step followed by checking for extra solutions. Whether J1 and J2 count as mistakes is a course decision. See the open questions.

Executable catalogs worth mining for test fixtures: MalruleLib (Chen, Liu & Sonkar, 2026) encodes 101 mal-rules as programs over 498 problem templates. Eedi's Kaggle dataset (2024) names 2,587 misconceptions linked to diagnostic questions.

## Part 2 · Detecting the mistake

### The motivating example, worked through

`2(x + 3) = 10 → 2x + 3 = 5`: `checkStep` says `x = 2` versus `x = 1`. Which buggy rules could produce `next`?

```text
2(x + 3) = 10   prev
 ├─ distribute (correct) ──→ 2x + 6 = 10
 │   └─ divide both sides by 2, only the last term on the left ──→ 2x + 3 = 5      x = 1, matches ✓
 ├─ distribute to first term only ──→ 2x + 3 = 10      x = 7/2, no match
 └─ divide both sides by 2, dividing inside the brackets ──→ 2(x + 3/2) = 5   x = 1, matches ✓
```

Two lessons follow:

- **The search should allow a valid step before the mistake.** The first branch is a correct step followed by a mistake. A search that applies mal-rules only to `prev` can't find it.
- **Both matching branches explain the step equally well.** The third branch's `2(x + 3/2) = 5` becomes `2x + 3 = 5` after one valid distribution, so it is the student's equation, not a coincidence. Both are forms of "didn't divide every term by 2", so a UI can name that mistake confidently even without knowing which branch the student took.

If the intended error is the textbook form of "forgot to distribute when multiplying both sides", `x/2 + 3 = 5 → x + 3 = 10`, that one needs no prefix: it is a single mal-rule applied to `prev`.

### Approaches compared

#### Mal-rules

Buggy rewrite rules such as `a(b + c) → ab + c`, applied at every matching position in `prev`. Each result is compared to `next`. This is how Sleeman's and the Ideas framework's diagnosers work, and how [#659](https://github.com/math-blocks/math-blocks/issues/659)–[#661](https://github.com/math-blocks/math-blocks/issues/661) are framed.

#### Structural diff

Align the trees of `prev` and `next` and look at what changed: a term that kept its sign across "=", one term that didn't get divided. Cheap, but it breaks down once the student reorders or combines steps.

#### Compare with the correct step

Take the solver's candidate next steps, find the one closest to `next`, and diff the two. This finds *where* the student went wrong, but not *what* they misunderstood.

#### Numeric fingerprint

Evaluate at sample points. For expressions, `next − prev` being constant, or `next/prev` being constant, says a lot: `2(x+3) → 2x+3` is off by exactly −3 everywhere. For equations it reduces to comparing two numbers, which says little.

|                             | Accuracy                                                                                                      | False positives                                                                                                                                                          | Combined steps                                                                                                | Cost                                                                                | Fit with `Rule`                                                                              |
|-----------------------------|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| **Mal-rules**               | High for errors that have a rule. Can only name what's in the library.                                        | Low for expressions. For equations, any mistake with the same answer also matches, and so can a wrong answer that matches by chance. Both are inherent, so measure them. | Mistake then valid steps: handled by matching on the answer. Valid steps then mistake: needs a prefix search. | One solve per candidate, about 1.3 ms each (measured). Fine for tens of candidates. | Native: a mal-rule *is* a `Rule`, and `Step.before` and the path give highlighting for free. |
| **Structural diff**         | Good for single local edits. Poor otherwise, and it breaks as soon as a student adds an unhelpful valid step. | Medium: any diff looks like something.                                                                                                                                   | Poor.                                                                                                         | Very cheap.                                                                         | None. It's separate machinery.                                                               |
| **Correct-step comparison** | Good at locating the error, weak at naming it.                                                                | Low for location.                                                                                                                                                        | Needs a multi-step search ([#661](https://github.com/math-blocks/math-blocks/issues/661)).                                                                             | Depends on [#657](https://github.com/math-blocks/math-blocks/issues/657). Cheap once that exists.                                           | Good: uses strategies directly.                                                              |
| **Solution-set comparison** | High for steps that add or lose a solution (J1–J4). Says nothing about other mistakes.                        | Very low. A superset or strict subset is unlikely by chance.                                                                                                             | Handled. Valid steps keep the solution set, so the relationship survives them.                                | Free. Both answers are already computed by `checkStep`.                             | None needed. It runs before any rule.                                                        |
| **Numeric fingerprint**     | Low alone. Useful as a filter or tie-breaker.                                                                 | High alone.                                                                                                                                                              | Indifferent: compares only start and end.                                                                     | Cheap. Needs [#635](https://github.com/math-blocks/math-blocks/issues/635)'s evaluator for variables and powers.                            | None, but it complements the others.                                                         |
| **Hybrid (recommended)**    | Highest.                                                                                                      | Low, with ambiguity reported rather than hidden.                                                                                                                         | One-step prefix plus a valid-step suffix.                                                                     | Bounded by a budget.                                                                | Built from `Rule` and `Strategy`.                                                            |

### Recommendation: mal-rule search, matched by the solver

Each stage reuses something that exists or is already planned:

1.  **Gate.** Run only on `'not-equivalent'`. A `'unknown'` step is never diagnosed, matching [#660](https://github.com/math-blocks/math-blocks/issues/660)'s "never reject on a guess".
2.  **Compare solution sets (equations only).** Treat `prevAnswer` and `nextAnswer` as sets of solutions.
    - If `next`'s set is a strict superset, report `added-solution` for each extra solution *r*. The student multiplied by, or squared, something that is zero at *r*.
    - If it is a strict subset, report `lost-solution` for each missing *r*. The student divided by something that is zero at *r*, or dropped a ±.
    - To point at the cause, look for a factor that is zero at *r*: in `next` for an added solution, such as the new `(x − 2)`, and in `prev` for a lost one, such as the cancelled `(x − 2)`. If none is found, report the solution without highlighting a node.
    - If neither set contains the other, go on to the mal-rules.

    The check is free, because `checkStep` already computed both answers, and it holds up after any valid steps. Today `checkStep` only reports "different", so this needs a set comparison of `Sequence` answers. Linear answers are a set of one.
3.  **Generate candidates.** For each prefix *P* in {no step} ∪ `nextSteps(prev)` ([#657](https://github.com/math-blocks/math-blocks/issues/657), depth ≤ 1), apply every mal-rule at every position in *P*'s result. Use the rewrite engine's traversal, so each candidate carries `step.before`, `step.after` and `path`. Drop any candidate that `checkStep` calls equivalent to `prev`. Some "mistakes" are harmless in context, such as partial distribution over `x + 0`.
4.  **Match with the solver.** A candidate matches when `checkStep(candidate, next)` is `'equivalent'`: the student made the mistake and then took only valid steps, helpful or not. This is the only matching test. Solve `next` once and reuse it, so a candidate costs one solve.
5.  **Rank by evidence about students.** Order matches by each mal-rule's base rate (taken from the literature now, and from logs later), then by fewer prefix steps. Then, as a tie-breaker only, by structural similarity: a soft score such as tree edit distance between the candidate and `next`, after folding numeric subterms. It degrades smoothly when the student adds unhelpful steps, and it never decides whether something matches. Return every match, not only the first, as [#661](https://github.com/math-blocks/math-blocks/issues/661) asks.
6.  **Group by mistake.** Merge matches that name the same `MistakeId`, as in the worked example. When all matches name one mistake, the UI can state it. When they name different mistakes, the UI should hedge ("it looks like you might have…") or ask the student which they did.
7.  **Locate and correct.**
    - **Where:** `step.before` is the faulty subterm. Its node ids come from `prev` when there's no prefix step, because untouched nodes keep their ids.
    - **Correction:** each mal-rule names its correct counterpart (A1 → distribute), which is applied to the same `before`.
    - **In `next`:** find the subtree whose `canonicalKey` equals `step.after`'s. If the student kept going, there may be none, and the UI highlights only the `prev` side.
8.  **Fallback.** If nothing matches and both steps are expressions, use a fingerprint (later, with [#635](https://github.com/math-blocks/math-blocks/issues/635)) to say something narrower. For example, if exactly one number changed, report an arithmetic slip, as the old `EVAL_ADD` did. Otherwise return `[]`.

#### What a match can prove

Students may take any valid step, including ones that don't move them toward an answer, such as adding `x²` to both sides. That limits what anything can recover from `next`:

- **Expressions:** a valid step keeps the expression equal to what it was. A solver match means the candidate and `next` are the same polynomial, which is strong evidence. Two different mistakes rarely produce the same polynomial.
- **Equations:** a valid step keeps only the solution set. Both sides and the whole shape can change. For a linear equation, the answer is all that survives. Comparing sides separately fails because adding to both sides changes each side. Comparing `left − right` up to a constant factor is the same as comparing solutions for a linear equation. So no matching method can separate two mistakes that give the same answer.

So for equations, ambiguity is a property of the problem, not a weakness of the method. Exact structural matches are too rare to rely on once unhelpful steps are allowed. The plan therefore uses structure only to rank, and puts the rest of its effort into grouping, hedged feedback and measuring how often wrong answers match a mistake by chance.

> **Why not a deeper search?** van der Hoek et al. (2025, via [#661](https://github.com/math-blocks/math-blocks/issues/661)) explained under a third of combined steps with a much larger search. Depth 1 plus the valid-step suffix covers the common case of a correct step followed by a mistake, and keeps the cost to tens of solves. An experimental run averaged about 2.6 ms per `checkStep` call, which includes two solves. Ten mal-rules over a handful of matching positions and up to five prefixes is a worst case of a few hundred milliseconds. In practice most mal-rules don't match at most positions. Add a time budget anyway.
>
> **A known gap:** the prefix search only tries steps the strategy would suggest. If a student first takes an unhelpful valid step, such as adding `x²` to both sides, and then makes a mistake, the search can't find it. That step comes back as "wrong, cause unknown". This is acceptable, because diagnosis never affects whether a step is accepted. Steps the student takes *after* the mistake are always covered, whatever they are.

### API sketch

#### In `@math-blocks/solver` (rewrite)

```ts
// types.ts: a mal-rule is a Rule, so traversal combinators and paths just work.
export type MalRule = Rule & {
  readonly kind: 'mistake';
  readonly mistake: MistakeId;
  /** The correct rule a student meant to apply, used to build the correction. */
  readonly intended: Rule;
};

// ../types.ts: one new Step variant, so mal-rules can yield ordinary Steps.
| StepType<'mistake', TNode, { readonly mistake: MistakeId }>

// rewrite/mistakes/index.ts: not imported by any strategy module.
// A lint rule or test asserts that no Strategy built for solving reaches a 'mistake' step.
export const MAL_RULES: readonly MalRule[];
```

#### In `@math-blocks/tutor`

```ts
export type MistakeId =
  | 'move-term-keep-sign'            // B2  x + 3 = 5 → x = 5 + 3
  | 'operate-on-one-term'            // F2/D2  2x + 6 = 10 → x + 6 = 5
  | 'operate-on-one-side'            // F3
  | 'distribute-first-term-only'     // A1, A2, A5
  | 'combine-unlike-terms'           // C1, C2
  | 'inequality-not-flipped'         // G1
  | 'wrong-inverse-operation'        // F1, B3
  | 'square-of-sum'                  // A4
  | 'cancel-term-not-factor'         // D1
  | 'add-fractions-across'           // D3
  | 'multiply-exponents'             // E1
  | 'added-solution'                 // J1, J2 (solution-set check, not a mal-rule)
  | 'lost-solution'                  // J3, J4 (solution-set check, not a mal-rule)
  | 'arithmetic-slip';               // I2 (fallback, not a mal-rule)

export type Diagnosis = {
  readonly mistake: MistakeId;
  /** 'solver': the candidate and `next` have the same simplified form or solutions. */
  readonly match: 'solver' | 'fingerprint';
  /** Tie-breaker only, 0–1: how closely the candidate's tree resembles `next`. */
  readonly similarity: number;
  /** Valid steps taken before the mistake, e.g. the distribution in 2(x+3)=10. */
  readonly stepsBefore: readonly Solver.Step[];
  /** The subterm the mistake rewrote. Ids are from `prev` when stepsBefore is empty. */
  readonly before: Semantic.types.Node;
  readonly path: readonly Semantic.types.Node[];
  /** What the mistake turned `before` into, and what it should have become. */
  readonly wrong: Semantic.types.Node;
  readonly correct: Semantic.types.Node;
  /** Nodes in `next` that came from `wrong`, when they can be found. */
  readonly nextNodes: readonly Semantic.types.Node[];
  /**
   * For 'added-solution' and 'lost-solution' only: the solution that changed.
   * `before` is then the factor that is zero there, if one was found.
   */
  readonly solution?: Semantic.types.Node;
};

export const diagnoseMistakes = (
  prev: Semantic.types.Node,
  next: Semantic.types.Node,
  options?: { readonly maxStepsBefore?: 0 | 1; readonly budgetMs?: number },
): readonly Diagnosis[];   // most likely first; [] = wrong, cause unknown
```

Keep `checkStep`'s result type unchanged, so the cheap validity check stays cheap and pure. A host calls `diagnoseMistakes` only on `'not-equivalent'`, perhaps after a short delay or when the student asks. `before`/`nextNodes`/`correct` map directly onto the old `prevNodes`/`nextNodes`/`corrections`, so a UI written for the old `Mistake` can be adapted. A UI decides how firmly to word feedback by checking whether the returned diagnoses all share one `mistake`. Student-facing text should live with the UI, keyed by `MistakeId`, not inside the solver.

### Which mistakes to support first

Ranked by how common the research says each is and how easily it can be detected with the code as it stands.

| Rank | Mistake                                      | How common                                | Detectable                                                                                              | Notes                                                                                                                                       |
|------|----------------------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| 1    | `move-term-keep-sign` (B2)                   | Negative-sign category, the most frequent | High. Local, and no prefix needed.                                                                      | On [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list.                                                                                                                            |
| 2    | `distribute-first-term-only` (A1, A2)        | High. A2 is in the sign category.         | High. Expressions match strongly.                                                                       | One rule covering positive and negative multipliers. On [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list.                                                                       |
| 3    | `operate-on-one-term` (F2, D2)               | High (equality category)                  | High with one prefix step                                                                               | The motivating example. Phase 1 handles the no-prefix forms. Phase 2 adds the prefix.                                                                 |
| 4    | `combine-unlike-terms` (C1)                  | Widely described as common                | High                                                                                                    | On [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list.                                                                                                                            |
| 5    | `inequality-not-flipped` (G1)                | Moderate (one study: about 6% of errors)  | Very high. The answers differ only in direction.                                                        | Trivial to match. Not on [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list, but cheap to add.                                                                                    |
| 6    | `added-solution`, `lost-solution` (J1–J4)    | Standard textbook warnings, no rates      | Very high once the solver can solve both steps. Today only cases like `(x − 2)(x + 3) = 2(x − 2)` work. | No mal-rules needed. The check works now for solvable cases, and grows as the solver learns `x² = c`, `x² − bx = 0` and x in a denominator. |
| 7    | `wrong-inverse-operation` (F1)               | High in one-step equations                | High, but answer-only for equations                                                                     | Phase 2.                                                                                                                                    |
| 8    | `cancel-term-not-factor` (D1)                | Common                                    | High                                                                                                    | Phase 2. On [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list.                                                                                                                   |
| 9    | `square-of-sum` (A4)                         | Common and persistent                     | Blocked by the `(x+1)²` bug                                                                             | Phase 2, after the bug is fixed.                                                                                                            |
| 10   | `multiply-exponents`, `add-fractions-across` | Common                                    | High                                                                                                    | Phase 2.                                                                                                                                    |
| 11   | Other quadratic mistakes (H1, H2, H5)        | Documented, no rates                      | Medium. `Sequence` answers need care.                                                                   | Phase 3.                                                                                                                                    |

The proposed first five are [#659](https://github.com/math-blocks/math-blocks/issues/659)'s list with "`(a+b)² → a²+b²`" and "cancel a term" swapped for "operate on one term" and "inequality not flipped". The first of those swaps is because of the bug. The second is because the flip is the cheapest win.

### Testing

- **A fixture table per mal-rule:** `[prev, next, expected MistakeId, printed before, printed correct]`. Use the catalog examples above, plus both forms of the motivating example.
- **Generated cases:** for each mal-rule, fill templates such as `a(bx + c) = d` with random small integers, apply the mal-rule, and assert that the expected diagnosis is among the results. MalruleLib's templates are a source of more.
- **Robustness to unhelpful steps:** take each generated case and follow the mistake with random valid steps that don't help, such as adding the same expression to both sides, multiplying both sides by a constant or rewriting a term. The diagnosis must still be found. This is the test that the plan doesn't secretly depend on structure.
- **A false-positive corpus:** random wrong steps, such as one number changed or a term dropped, should mostly give `[]` or `arithmetic-slip`. Report two numbers in the test output: how often an expression step gets a conceptual diagnosis by chance, and the same for equation steps. Expect the equation rate to be higher, especially with small integers. It decides how firmly the UI words feedback.
- **Solution-set tests:** the J examples above, each with the expected solution and highlighted factor. Include steps where that check must stay quiet: `1/x = 2 → 1 = 2x` (valid, same solutions), and a step that both loses and adds solutions, which must go on to the mal-rules.
- **Ambiguity tests** fix the expected *set* of diagnoses for known collisions, and check that matches with the same `MistakeId` are grouped, as in the worked example.
- **Invariants:**
  - A mal-rule never yields a result equivalent to its input, or such candidates are dropped.
  - No solving strategy ever produces a `'mistake'` step.
  - `diagnoseMistakes` on an equivalent pair returns `[]`.
- **Highlighting:** `before` has an id that exists in `prev`, and `nextNodes` have ids that exist in `next`, like the old `filterMistakes` check.
- **Performance:** a test that a long expression with many matching positions finishes within the budget.

### Phased rollout

Issue types follow CLAUDE.md. Several of these fit existing issues, so update those rather than filing duplicates.

| Phase | Issue                                                                                                                                                                      | Type    | Depends on                                                            |
|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|-----------------------------------------------------------------------|
| 0     | `checkStep` rejects `(x + 1)² → x² + 2x + 1`. Expand powers of sums when simplifying for comparison.                                                                       | Bug     | None                                                                  |
| 0     | Solve `x² = c`, `x² − bx = 0` and linear equations with x in a denominator, which `checkStep` reports as `'unknown'` today.                                                | Feature | None                                                                  |
| 1     | Solution-set check in `diagnoseMistakes`: `added-solution` and `lost-solution`, with the responsible factor highlighted when it can be found.                              | Feature | diagnoseMistakes. Covers more cases once the solver item above lands. |
| 1     | Add the `MalRule` type and a `'mistake'` step variant, with a test that solving strategies can't reach mistake steps. *(Update [#659](https://github.com/math-blocks/math-blocks/issues/659)'s "Done when".)*                      | Task    | None                                                                  |
| 1     | The first five mal-rules: `move-term-keep-sign`, `distribute-first-term-only`, `operate-on-one-term`, `combine-unlike-terms`, `inequality-not-flipped`. *(This is [#659](https://github.com/math-blocks/math-blocks/issues/659).)* | Feature | MalRule type                                                          |
| 1     | `diagnoseMistakes` with no prefix: solver matching, ranking, grouping by mistake, `before`/`correct`/`nextNodes`, and a time budget. *(The "mistake" half of [#660](https://github.com/math-blocks/math-blocks/issues/660).)*      | Feature | First five mal-rules                                                  |
| 1     | Fixture, generated, unhelpful-step, false-positive and performance test suites for diagnosis.                                                                              | Task    | diagnoseMistakes                                                      |
| 2     | Allow one valid step before the mistake, so `2(x + 3) = 10 → 2x + 3 = 5` is diagnosed. *(Part of [#661](https://github.com/math-blocks/math-blocks/issues/661).)*                                                                  | Feature | [#657](https://github.com/math-blocks/math-blocks/issues/657) nextSteps                                                       |
| 2     | Mal-rules for wrong inverse operation, cancelling a term, square of a sum, multiplying exponents and adding fractions across.                                              | Feature | Phase 0 bug, for square of a sum                                      |
| 2     | Arithmetic-slip and fingerprint fallback.                                                                                                                                  | Feature | [#635](https://github.com/math-blocks/math-blocks/issues/635) evaluator                                                       |
| 3     | Quadratic mal-rules: zero product with a non-zero side, root sign, factoring sign errors.                                                                                  | Feature | Solver handling `x² − bx = 0`                                         |
| 3     | Highlight the diagnosed nodes in `@math-blocks/react` and show feedback keyed by `MistakeId`.                                                                              | Feature | Phase 1                                                               |

Changesets: Phase 1 adds exports to solver (`MalRule`, the step variant) and tutor (`diagnoseMistakes`, `MistakeId`, `Diagnosis`). Both are `patch` bumps, unless the tutor's old numeric `MistakeId` enum was ever released, in which case replacing it with a string union is a `minor` bump.

## Open questions

1.  **Which error is the motivating example?** Is `2(x + 3) = 10 → 2x + 3 = 5` meant as "distributed, then halved only one term", or as the textbook `x/2 + 3 = 5 → x + 3 = 10`? The first needs the Phase 2 prefix search. The second works in Phase 1.
2.  **What should the UI do when diagnoses disagree?** On equations, two different mistakes can explain the same step equally well. Should the tutor hedge, ask the student which they did, or say nothing specific? And at what false-positive rate should it stop naming a mistake firmly?
3.  **Is multiplying by an expression with x in it a mistake?** It's the standard way to clear fractions. Should the tutor flag a step that adds a solution (J1, J2) as a mistake? Or should it accept it as a legitimate step, as some courses teach, and remind the student to check for extra solutions at the end? Losing a solution (J3, J4) seems a mistake either way.
4.  **Is the gap for unhelpful steps before a mistake acceptable?** Those steps come back as "wrong, cause unknown". Closing the gap would need a much larger search, with no evidence yet that students do this often.
5.  **Separate function, or part of `checkStep`?** Should diagnosis stay a separate call, or should `checkStep` take `{ diagnose: true }` and attach `mistakes` to a `'not-equivalent'` result?
6.  **Where should mal-rules live?** [#659](https://github.com/math-blocks/math-blocks/issues/659) puts them in the solver beside the correct rules. The alternative is the tutor, which would keep the solver free of anything that can produce wrong maths.
7.  **What should the tutor do with a diagnosis?** Selent & Heffernan found buggy messages alone no better than hints, while Booth et al. (2013) found self-explaining incorrect examples helps. Is the goal highlighting, a message, a prompt to explain, or reporting to a teacher?
8.  **Are there student logs?** Is there any source of real student steps, from a demo, a pilot or Storybook sessions, to set base rates and find mal-rules the literature misses? Payne & Squibb found the dominant mal-rules differ by school.
9.  **Should arithmetic slips be reported** as mistakes, as `EVAL_ADD` did, or left as "wrong, cause unknown" so they don't drown out conceptual diagnoses?
10. **Has the old API shipped?** Was the old `MistakeId`/`Mistake` API from 869b363 published in a release? That decides the changeset level, and whether to keep the old names.

## References

Links marked *\[unverified\]* are DOIs from memory or from others' reference lists that couldn't be confirmed in a search result.

1.  Booth, J. L., Barbieri, C., Eyer, F., & Paré-Blagoev, E. J. (2014). Persistent and pernicious errors in algebraic problem solving. *Journal of Problem Solving, 7*(1), 3. [doi:10.7771/1932-6246.1161](https://doi.org/10.7771/1932-6246.1161) · [ERIC PDF](https://files.eric.ed.gov/fulltext/EJ1059995.pdf)
2.  Booth, J. L., & Koedinger, K. R. (2008). Key misconceptions in algebraic problem solving. *Proc. 30th Annual Conference of the Cognitive Science Society*, 571–576. [PDF](https://pact.cs.cmu.edu/pubs/BoothKoedingerCogSci2008.pdf)
3.  Booth, J. L., Lange, K. E., Koedinger, K. R., & Newton, K. J. (2013). Using example problems to improve student learning in algebra. *Learning and Instruction, 25*, 24–34. [doi](https://doi.org/10.1016/j.learninstruc.2012.11.002) *\[unverified\]* · [Algebra by Example](https://www.serpinstitute.org/algebra-by-example/research)
4.  Brown, J. S., & Burton, R. R. (1978). Diagnostic models for procedural bugs in basic mathematical skills. *Cognitive Science, 2*(2), 155–192. [doi](https://doi.org/10.1207/s15516709cog0202_4) *\[unverified\]*
5.  Brown, J. S., & VanLehn, K. (1980). Repair theory: A generative theory of bugs in procedural skills. *Cognitive Science, 4*(4), 379–426. [doi](https://doi.org/10.1207/s15516709cog0404_3) *\[unverified\]*
6.  Bush, S. B., & Karp, K. S. (2013). Prerequisite algebra skills and associated misconceptions of middle grade students: A review. *Journal of Mathematical Behavior, 32*(3), 613–632. [doi:10.1016/j.jmathb.2013.07.002](https://doi.org/10.1016/j.jmathb.2013.07.002)
7.  Chen, X., Liu, N., & Sonkar, S. (2026). MalruleLib: Large-scale executable misconception reasoning with step traces. *ACL 2026*. [arXiv:2601.03217](https://arxiv.org/abs/2601.03217)
8.  Clement, J. (1982). Algebra word problem solutions: Thought processes underlying a common misconception. *JRME, 13*(1), 16–30. [doi](https://doi.org/10.2307/748434) *\[unverified\]*
9.  Falkner, K. P., Levi, L., & Carpenter, T. P. (1999). Children's understanding of equality: A foundation for algebra. *Teaching Children Mathematics, 6*(4), 232–236.
10. Herscovics, N., & Linchevski, L. (1994). A cognitive gap between arithmetic and algebra. *Educational Studies in Mathematics, 27*(1), 59–78. [doi:10.1007/BF01284528](https://doi.org/10.1007/BF01284528)
11. van der Hoek, Jeuring & Bos (2025). Diagnosing combined steps in algebra. Cited in issue [\[#661](https://github.com/math-blocks/math-blocks/issues/661)](https://github.com/math-blocks/math-blocks/issues/661). Full citation is in the issue.
12. Kieran, C. (1981). Concepts associated with the equality symbol. *Educational Studies in Mathematics, 12*(3), 317–326. [doi](https://doi.org/10.1007/BF00311062) *\[unverified\]*
13. Kirshner, D., & Awtry, T. (2004). Visual salience of algebraic transformations. *JRME, 35*(4), 224–257. [doi:10.2307/30034809](https://doi.org/10.2307/30034809) · [LSU repository](https://repository.lsu.edu/education_pubs/159)
14. Knuth, E. J., Stephens, A. C., McNeil, N. M., & Alibali, M. W. (2006). Does understanding the equal sign matter? Evidence from solving equations. *JRME, 37*(4), 297–312. [PDF](https://alibali.psych.wisc.edu/wp-content/uploads/sites/371/2018/02/KnuthStephensMcNeilAlibali2006.pdf)
15. Knuth, E. J., Alibali, M. W., Hattikudur, S., McNeil, N. M., & Stephens, A. C. (2008). The importance of equal sign understanding in the middle grades. *Mathematics Teaching in the Middle School, 13*(9), 514–519. [PDF](https://alibalilab.wiscweb.wisc.edu/wp-content/uploads/sites/371/2018/02/KnuthAlibaliHattikudurMcNeilStephens2008.pdf)
16. Küchemann, D. (1981). Algebra. In K. Hart (Ed.), *Children's Understanding of Mathematics: 11–16*, 102–119. John Murray.
17. Matz, M. (1982). Towards a process model for high school algebra errors. In D. Sleeman & J. S. Brown (Eds.), *Intelligent Tutoring Systems*, 25–50. Academic Press.
18. Payne, S. J., & Squibb, H. R. (1990). Algebra mal-rules and cognitive accounts of error. *Cognitive Science, 14*(3), 445–481. [doi:10.1207/s15516709cog1403_4](https://doi.org/10.1207/s15516709cog1403_4)
19. Selent, D., & Heffernan, N. (2015). When more intelligent tutoring in the form of buggy messages does not help. *AIED 2015*, LNCS. [link](https://www.springerprofessional.de/when-more-intelligent-tutoring-in-the-form-of-buggy-messages-doe/2469662)
20. Sleeman, D. (1984). An attempt to understand students' understanding of basic algebra. *Cognitive Science, 8*(4), 387–412. [doi](https://doi.org/10.1207/s15516709cog0804_5) *\[unverified\]* · [ERIC report](https://files.eric.ed.gov/fulltext/ED258847.pdf)
21. Sleeman, D. (1985). Basic algebra revisited: A study with 14-year-olds. *International Journal of Man-Machine Studies, 22*(2), 127–149. [link](https://www.sciencedirect.com/science/article/abs/pii/S0020737385800663)
22. Tirosh, D., Even, R., & Robinson, N. (1998). Simplifying algebraic expressions: Teacher awareness and teaching approaches. *Educational Studies in Mathematics, 35*(1), 51–64. [doi](https://doi.org/10.1023/A:1003011913153) *\[unverified\]*
23. Tsamir, P., Tirosh, D., & Almog, N. (1998). Students' solutions of inequalities. *Proc. PME 22*, 4, 129–136.
24. Tsamir, P., & Bazzini, L. (2001). Can x = 3 be the solution of an inequality? A study of Italian and Israeli students. *Proc. PME 25*. [link](https://funes.uniandes.edu.co/funes-documentos/can-x3-be-the-solution-of-an-inequality-a-study-of-italian-and-israeli-students)
25. Vaiyavutjamai, P., & Clements, M. A. (2006). Effects of classroom instruction on students' understanding of quadratic equations. *Mathematics Education Research Journal, 18*(1), 47–77. [doi](https://doi.org/10.1007/BF03217429) *\[unverified\]*
26. Vlassis, J. (2004). Making sense of the minus sign or becoming flexible in "negativity". *Learning and Instruction, 14*(5), 469–484. [doi](https://doi.org/10.1016/j.learninstruc.2004.06.012) *\[unverified\]*
27. Wang, Z., et al. (2020). Instructions and guide for diagnostic questions: The NeurIPS 2020 Education Challenge. [arXiv:2007.12061](https://arxiv.org/abs/2007.12061)
28. Eedi (2024). *Mining Misconceptions in Mathematics* (Kaggle). [dataset](https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics/data) *\[unverified\]* · [Eedi write-up](https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions)
