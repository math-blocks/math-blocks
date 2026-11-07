# Classical term rewriting and strategy languages as a rewriting core for `@math-blocks/solver`

Research note, 2026-11-07. Network limits: arxiv.org, mathjs.org, docs.sciml.ai, maude.cs.illinois.edu and spoofax.readthedocs.io were unreachable from this session. Their content is cited from search snippets, or from the projects' public GitHub source, which I shallow-cloned and read directly. Source-code citations point to the GitHub repo file paths.

Baseline, what the solver does today (read from `packages/solver/src/simplify/simplify.ts` in this repo):
- `simplify()` holds an ordered array of 19 `Transform`s: `dropAddIdentity, simplifyDivByFrac, simplifyMul, mulByZeroIsZero, distribute, distributeDiv, collectLikeTerms, dropParens, evalMul, evalAdd, reduceFraction, mulFraction, evalDiv, mulToPow, multiplyPowers, dividePowers, removePowOne, addNegToSub`.
- At each numeric node, on exit (post-order) from `traverseNumeric`, it tries the transforms in order. The first one that returns a `Step` wins. It records the step, then retries at the same node, up to 10 times.
- An outer loop re-traverses the whole tree, up to 10 times, until nothing changes.
- Comments in the file show that ordering is being used to encode policy, e.g. "we want to eval multiplication before mulToPower to avoid (3)(3) -> 3^2" and "We put this last so that we don't covert 3 + -(x + 1) to 3 - (x + 1) before distributing".
- `Step` is `{message, before, after, substeps, section?}`, and `message` is a closed string-literal union (`packages/solver/src/types.ts`).

In strategy-combinator terms the current loop is roughly
`repeat≤10( bottomup( repeat≤10( t1 <+ t2 <+ … <+ t19 ) ) )`. That is a capped form of SymbolicUtils' `Fixpoint(Postwalk(Fixpoint(Chain-first-success)))`. Stratego's `innermost` differs in one respect: it also re-normalizes the children of a freshly rewritten node immediately (definitions below).

---

## 1. Rewriting modulo AC: AC-matching algorithms and complexity, Maude's approach, and flattened n-ary representations

### Takeaway
Matching modulo associativity and/or commutativity is NP-complete in general. Production systems (Maude, Mathematica, MatchPy, SymbolicUtils, mathjs) handle it in one of two ways. Some use flattened, sorted n-ary argument lists plus "extension" or sequence variables. Others brute-force permutations of small argument lists. The solver's flattened n-ary `Add`/`Mul` nodes already match the representation these systems use internally. Rules over them are easiest to express with segment/rest variables (`a + b + ...rest`), not with full AC matching.

### Cited Findings
- Benanav, Kapur & Narendran ("Complexity of matching problems", RTA 1985 / JSC 1987) proved AC matching NP-complete by reduction from 3SAT. Associative-only and commutative-only matching are also NP-complete. If each variable occurs only once in the pattern (linear patterns), AC matching has a polynomial upper bound. — [Springer DOI 10.1007/3-540-15976-2_22](https://dx.doi.org/10.1007/3-540-15976-2_22); [academia.edu copy](https://www.academia.edu/125811022/Complexity_of_matching_problems)
- NP-completeness concerns deciding whether one match exists. Enumerating all AC matches can be exponential. — [Krebber, "Non-linear Associative-Commutative Many-to-One Pattern Matching with Sequence Variables" (arXiv 1705.00907)](https://arxiv.org/pdf/1705.00907) (search snippet only; arxiv unreachable)
- Maude implements rewriting modulo axioms declared as equational attributes (`assoc`, `comm`, `id:`). It uses "extension variables" and "extension aware" matching to get coherence. For an equation whose LHS has a top AC symbol, Maude implicitly adds a companion equation with an extension variable, so a rule can match a sub-multiset of the arguments. — [Maude manual (3.x, §4.8)](https://maude.cs.illinois.edu/manual/maude-manual88.html); [Maude 3.2 manual](https://maude.lcc.uma.es/maude32-manual-html/maude-manual74.html) (search snippets only)
- Eker's AC matching algorithm (J. Automated Reasoning) is the standard reference for Maude's matcher. Hullot (IJCAI 1979) is the earlier work. — [search summary of Maude manual references](https://maude.cs.illinois.edu/manual/maude-manual88.html)
- Tamarin (a protocol prover) calls Maude as an external engine to compute complete sets of AC unifiers and matchers. That shows how good Maude's AC machinery is considered to be. — [tamarin-prover-term docs](https://hackage.haskell.org/package/tamarin-prover-term-0.4.0.0/docs/Term-Unification.html)
- mathjs uses the same extension trick in plain JS. When a rule's top operator is associative, `simplify` builds an `expanded` rule variant with an extra placeholder operand. In the source comment: "This allows us to match rules like 'n+n' to the expression '(1+x)+x' or even 'x+1+x' if the operator is commutative." It also builds non-commutative variants `expandedNC1`/`expandedNC2`. — [mathjs `src/function/algebra/simplify.js` (`applyRule`, `_buildRules`)](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)
- mathjs flattens the tree before each rule application and unflattens it back to a left-heavy binary tree afterward: `flatten(res, context)` → `applyRule` → `unflattenl(res, context)`, with the comment "Use left-heavy binary tree internally, since custom rule functions may expect it". — [mathjs simplify.js `_simplify`](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)
- Mathematica: `Flat` lets variables in `f[x_, y_]` match any subsequence of a flat function's arguments. `OneIdentity` makes `f[x]` equivalent to `x` for matching. `Orderless` makes the matcher try reorderings. Per a MathGroup reply, with `Flat`+`Orderless` only sorted versions of each sequence are tried. The Flat docs say `BlankSequence`/`BlankNullSequence` are not affected by `Flat`. A 2004 forum post claims sequence patterns don't work with `Flat`, which conflicts with that. — [Wolfram ref: Flat](https://reference.wolfram.com/language/ref/Flat.html); [Wolfram ref: OneIdentity](https://reference.wolfram.com/mathematica/ref/OneIdentity.html); [MathGroup 2006](https://forums.wolfram.com/mathgroup/archive/2006/Jan/msg00171.html); [MathGroup 2004](https://forums.wolfram.com/mathgroup/archive/2004/Apr/msg00618.html)
- MatchPy supports associative and/or commutative function symbols and sequence variables, "similar to pattern matching in Mathematica". The docs note that "pattern matching with either associativity or commutativity is NP-complete in both cases" and that sequence variables allow several distinct matches for one pattern. — [MatchPy docs](https://matchpy.readthedocs.io/en/latest/index.html); [MatchPy JOSS paper arXiv 1710.06915](https://arxiv.org/pdf/1710.06915)
- SymbolicUtils' `@acrule` is a "special macro meant for rules on functions which are associative and commutative such as addition and multiplication". Example: `@acrule((~a)^(~x) * (~a)^(~y) => (~a)^(~x + ~y))` matches `x^y * x^z`. Segment variables `~~xs` match a vector of 0+ subexpressions. — [SymbolicUtils.jl `docs/src/manual/rewrite.md`](https://github.com/JuliaSymbolics/SymbolicUtils.jl/blob/master/docs/src/manual/rewrite.md)
- CortexJS Compute Engine's `ReplaceOptions` has `matchPermutations` ("If true (default), commutative matches may permute operands") and `useVariations` ("rules may match equivalent variants. Can be powerful but may introduce recursion hazards"). Its wildcard grammar includes `a`, `...a` (sequence) and `...a?` (optional sequence). — [compute-engine `src/compute-engine/types-kernel-serialization.ts`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-serialization.ts); [`boxed-expression/rules.ts`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/boxed-expression/rules.ts)

### Inferences
- The solver's n-ary `Add`/`Mul` is the "flattened" form that Maude, Mathematica and mathjs build internally. Associativity is therefore already handled by representation. The design question that remains is commutativity, i.e. which subset of args a rule may grab and in what order.
- For a step-by-step solver, full AC matching is partly undesirable. A student-facing step like "collect like terms" should say which terms were brought together, and the solver already has a dedicated "reorder terms so that like terms are beside each other" step message. Linear patterns plus segment variables (`…pre, a·x, …mid, b·x, …post`) are polynomial (per Benanav et al.'s linear case). They also give explicit positions to show in the step, and their enumeration order is deterministic: leftmost pair first.
- Recommended shape: patterns over n-ary nodes with sequence/rest variables, matched left to right with backtracking. Opt-in commutativity per rule, as mathjs's `assuming: {multiply: {commutative: true}}` and CE's `matchPermutations` do. A cap on permutations keeps worst-case cost bounded. Expressions in a browser algebra tutor are small (tens of nodes), so the NP-hardness is not a practical concern at that size.

### Gaps
- I could not read Eker's AC-matching paper or the Maude manual's AC chapter in full (hosts blocked). Exact algorithmic details, such as bipartite-graph/Diophantine-system reduction, are not verified here.
- I could not access the full MatchPy paper for its benchmark numbers.

---

## 2. Strategy languages, and how they map to the solver's loop

### Takeaway
Stratego, Maude's strategy language, ELAN, Rascal, Kiama/Tom, SymbolicUtils and SymPy's `strategies` all separate rules (local rewrites that succeed or fail) from strategies (traversal plus control). They share a common combinator core: sequence, left-biased choice, try, repeat, one/all/some, topdown/bottomup/oncetd/innermost. That separation is exactly what the solver's hard-coded loop mixes together. A small TS combinator library of perhaps 15 combinators could express the current behavior precisely and make its alternatives explicit.

### Cited Findings
- Stratego library definitions: `try(s) = s <+ id`, `repeat(s) = try(s; repeat(s))`, `topdown(s) = s; all(topdown(s))`. `<+` is deterministic left-biased choice. `innermost` applies `s` repeatedly to the lowest, left-most matching subterm and computes normal forms. `oncetd` and `spinetd` are listed among the one-pass traversals. — [Spoofax Stratego docs: Strategy Combinators](https://spoofax.readthedocs.io/en/latest/source/langdev/meta/lang/stratego/strategoxt/07-strategy-combinators.html) (search snippet); [program-transformation.org: Strategy Definition](https://program-transformation.org/Stratego/StrategyDefinition.html); [Tom manual 2.4 (innermost definition)](https://tom.loria.fr/soft/release-2.4/manual-2.4/manual008.html); [Visser tech report UU-CS-2001-28](https://ics-archive.science.uu.nl/research/techreps/repo/CS-2001/2001-28.pdf)
- Kiama (Scala) ports the same Stratego combinator vocabulary as a library, not a language. That is evidence the approach works as an embedded library in a host language, as a TS one would. — [Kiama Rewriter javadoc](https://javadoc.io/static/com.googlecode.kiama/kiama_2.9.2/1.4.0/org/kiama/rewriting/Rewriter.html)
- Maude strategy language: "The Maude strategy language" by Eker, Martí-Oliet, Meseguer, Rubio and Verdejo (JLAMP 2023). It combines rule applications using regular-expression constructions (concatenation, union, iteration), a generalized if-then-else whose condition is itself a strategy (from which `or-else` is derived), subterm-control combinators (`matchrew`), and recursion. The idea dates from "Towards a strategy language for Maude" (WRLA 2004). Probabilistic `matchrew`/`xmatchrew`/`amatchrew` variants exist (manual §10.1.2). — [Maude strategies page (UCM)](https://maude.ucm.es/strategies); [arXiv 2401.07749](https://arxiv.org/pdf/2401.07749); [Verdejo, "Towards a strategy language for Maude"](https://maude.ucm.es/alberto-verdejo/papers/wrla04.html); [Deduction, strategies, and rewriting](https://maude.ucm.es/alberto-verdejo/papers/strategies06.php)
- Maude's rewriting-logic split: equations (`eq`, assumed confluent and terminating, applied to normal form modulo axioms) versus rules (`rl`, possibly non-deterministic, controlled by strategies). — [Maude strategies page](https://maude.ucm.es/strategies); [Maude manual](https://maude.cs.illinois.edu/manual/maude-manual88.html) (search snippets)
- SymbolicUtils.jl (actively maintained; last commit 2026-11-04) provides these rewriter combinators:
  - `Chain(itr)`: apply each in order. `nothing` counts as no-change.
  - `RestartedChain(itr)`: "restarts from the first rewriter once on the first successful application".
  - `IfElse(cond, rw1, rw2)`.
  - `Prewalk(rw)`: pre-order traversal.
  - `Postwalk(rw)`: post-order, "from left to right and from bottom to top".
  - `Fixpoint(rw)`: repeat until no change.
  - `PassThrough(rw)`: return the input instead of `nothing`.

  — [SymbolicUtils.jl `docs/src/manual/rewrite.md`](https://github.com/JuliaSymbolics/SymbolicUtils.jl/blob/master/docs/src/manual/rewrite.md)
- Metatheory.jl (last commit 2026-09-26) keeps a "Classical Term Rewriting" mode alongside e-graphs. It has three rule kinds: `-->` (symbolic substitution), `=>` (dynamic, RHS evaluated), and `==` (bidirectional, e-graph only: "Doesn't work in classical rewriting"). It reuses `Postwalk`, `Fixpoint` and `FixpointNoCycle`. — [Metatheory.jl `docs/src/rewrite.md`](https://github.com/JuliaSymbolics/Metatheory.jl/blob/master/docs/src/rewrite.md)
- SymPy `strategies` is an experimental package whose stated goal is separating mathematical rules from the algorithms that apply them. Its submodules are `rl` (rules), `core` (generic strategies), `traverse` (tree walks: `top_down`, `bottom_up`) and `tools`. `exhaust` applies a rule until there is no change. `top_down` is built from `chain` and `do_one`. — [Matthew Rocklin, "Strategies" blog (2012)](https://matthewrocklin.com/blog/work/2012/11/07/Strategies); [modelparameters mirror of sympy.strategies docs](https://computationalphysiology.github.io/modelparameters/modelparameters.sympy.strategies.html)
- mathsteps (the JS step-by-step simplifier) contains a hand-rolled mini strategy layer:
  - `TreeSearch.preOrder(fn)` / `postOrder(fn)` return on the first change. That is effectively `oncetd` / `oncebu` returning a `Status`.
  - `stepThrough` loops `step()` until no change, with `MAX_STEP_COUNT = 20`. Hitting the cap logs "Potential infinite loop" and returns no steps.
  - `step()` tries 9 searches in priority order, and the first that changes wins: `basicsSearch, divisionSearch, fractionsSearch, collectAndCombineSearch, arithmeticSearch, breakUpNumeratorSearch, multiplyFractionsSearch, distributeSearch, functionsSearch`.

  — [mathsteps `lib/TreeSearch.js`, `lib/simplifyExpression/stepThrough.js`](https://github.com/google/mathsteps)

### Mapping to the solver (Inferences below; the combinator semantics are from the sources above)

| Current solver behavior | Combinator expression |
|---|---|
| Try transforms in priority order, first wins | `choice(t1, …, tn)` = `t1 <+ t2 <+ …` (Stratego), `RestartedChain`-like (SymbolicUtils) |
| Retry at the same node ≤10 times | `repeat(choice(...))` with a fuel cap |
| Visit nodes on exit (inside-out) | `bottomup(s)` / `Postwalk(s)` |
| Outer re-traversal ≤10 times until unchanged | `Fixpoint(Postwalk(...))` / `repeat(bottomup(...))` |
| Alternative: one step per call (mathsteps style, best for "show every step") | `repeat( oncebu(choice(...)) )`: each iteration emits exactly one Step at one position |
| Normalize fully at a node before moving up | `innermost(choice(...))` |
| Phase ordering (e.g. "addNegToSub last") | `seq(repeat(oncebu(phaseA)), repeat(oncebu(phaseB)))` instead of relying on list position |

### Inferences
- The current loop is a hybrid. It applies a rewrite, re-tries at the same node, but doesn't re-normalize the new children, and leaves that to the outer re-traversal. The step sequence is therefore an artifact of loop structure as well as of rule order. Making the strategy explicit, e.g. `fixpoint(oncebu(firstOf(rules)))`, would make step order predictable and testable.
- `oncebu` with "one step per iteration" is the strategy closest to pedagogical presentation. mathsteps used exactly this shape, and its main step loop never applies more than one change per emitted step.
- Strategies give a natural hook for substeps. A combinator like `named("collect like terms", seq(reorder, factorVar, computeCoeffs))` can record the inner steps as `substeps` of an outer `Step`. That mirrors the existing messages "reorder terms…", "factor variable part…", "compute new coefficients".
- Fuel/step caps should be part of the combinator semantics, e.g. `repeat(s, {max})`. Both mathsteps (20) and the solver (10/10) already use ad-hoc caps.

### Gaps
- I couldn't fetch the exact Stratego definitions of `oncetd`, `oncebu`, `outermost`, `alltd` and `downup` (host blocked). The standard definitions, `oncetd(s) = s <+ one(oncetd(s))` and `oncebu(s) = one(oncebu(s)) <+ s`, are from my background knowledge and are not verified against a fetched source here.
- ELAN and Rascal: not researched within the tool budget. Both are known to have strategy/visit constructs, but nothing here is sourced.
- I found no maintained, widely used TS/JS strategy-combinator library for term rewriting. No result surfaced, which is weak evidence that none exists.

---

## 3. Rule-based CAS: Mathematica, Rubi, SymPy/MatchPy, Symbolics.jl, Metatheory.jl

### Takeaway
The largest real-world rule-based system with step display is Rubi. It is about 6,600–6,700 integration rules, and it gets determinism by design: rules are arranged as a decision tree with mutually exclusive side conditions, loaded in a "vitally important" order, and each step names the rule and its conditions. CortexJS has ported Rubi's rules to TypeScript, with step explanations, which shows that a large rule base with steps is feasible in a browser TS engine.

### Cited Findings
- Rubi is "a large set of transformation rules" applied "step by step until the final solution is found". It "out-performs Maple and Mathematica… on a grueling integration test suite, consisting of over 70 thousand integrands". "Since Rubi rules follow a decision tree, the transformation and the required conditions can be provided for each integration step." — [Rubi README (GitHub)](https://github.com/RuleBasedIntegration/Rubi)
- Rubi rule order: rules are extracted from notebooks into package files, and "the order in which the rules are loaded in `Rubi.m` is **vitally important** to get a working Rubi package." — [Rubi README](https://github.com/RuleBasedIntegration/Rubi)
- Rubi step display (`ShowStepRoutines.m`) rewrites every `Int` rule so that its RHS is wrapped in `HoldForm`. It then drives evaluation with `FixedPoint[(Print[#]; ReleaseHold[#])&, …]`. `Steps`/`Step` collect `RubiRule[..]` and `RubiIntermediateResult[..]` via `Sow`/`Reap`, and `ShowStepFormatting.m` formats them. — [Rubi README](https://github.com/RuleBasedIntegration/Rubi)
- The Rubi Mathematica repo's last commit is 2024-02-22, so it is low activity. — [GitHub RuleBasedIntegration/Rubi](https://github.com/RuleBasedIntegration/Rubi) (git log of shallow clone)
- Rule count: the CortexJS port's `rubi-rules-data.json` contains 6,574 rules across 178 rule files (my count from the JSON). Each rule has `lhs` (Mathematica-style `Blank`/`BlankOptional` patterns), `rhs`, `condition` (e.g. `FreeQ`, `EqQ`, `IntegerQ`), local `bindings`, and an `innerCondition`. A 2018 SymPy GSoC report cites "roughly 10,000 rules". The figures conflict, probably because of different Rubi versions or ways of counting. — [compute-engine `src/compute-engine/rubi/rubi-rules-data.json`](https://github.com/cortex-js/compute-engine/tree/main/src/compute-engine/rubi); [GSoC 2018 Rubi report](https://github.com/ashishkg0022/Gsoc-proposal-Rubi/wiki/GSoC-2018-Rubi-Final-Report)
- CortexJS's Rubi driver records each step as `{ node, replacement, because }`. `replayIntRecords` then rebuilds "a curated, whole-state step chain for `expr.explain('Integrate')`" by substituting into inert `Integrate` placeholders. Records it cannot place are skipped ("graceful degradation — the chain stays sound, just less detailed"). — [compute-engine `src/compute-engine/rubi/explain-trace.ts`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/rubi/explain-trace.ts)
- SymPy's Rubi effort was built on MatchPy (2017 GSoC). A SymPy issue later argued the module was large and effectively unused, and proposed moving it out. A separate PyPI package, `rubi-integrate`, now uses a different matcher, OmniMatch. — [GSoC 2017 report](https://www.github.com/sympy/sympy/wiki/GSoC-2017-Report-Abdullah-Javed-Nesar:-Rule-based-Integrator); [sympy issue #20743](https://github.com/sympy/sympy/issues/20743); [PyPI rubi-integrate](https://pypi.org/project/rubi-integrate/)
- MatchPy provides `ManyToOneMatcher`, which matches many patterns against one subject at once with AC and sequence-variable support, generalizing discrimination nets. Syntactic patterns go to `DiscriminationNet`, which "is usually faster". The latest version is 0.5.5, and the repo's last commit is 2021-10-29, so it is dormant. — [MatchPy docs](https://matchpy.readthedocs.io/); [PyPI matchpy](https://pypi.org/project/matchpy); [GitHub HPAC/matchpy](https://github.com/HPAC/matchpy) (git log)
- SymbolicUtils rule syntax: `@rule ~x * +(~~ys) => sum(map(y-> ~x * y, ~~ys))` (distribution over an n-ary sum). Predicates attach as `~x::pred` or `~~x::pred` on segments. If a slot appears twice, matches must be equal. — [SymbolicUtils rewrite.md](https://github.com/JuliaSymbolics/SymbolicUtils.jl/blob/master/docs/src/manual/rewrite.md)

### Inferences
- Rubi's lesson for the solver: determinism comes from mutually exclusive side conditions plus fixed order, not from a clever engine. That makes each step explainable as "rule N applied because conditions C held". The solver's ordering comments are informal versions of the same thing. They could become explicit guards on rules.
- Rubi's `HoldForm`/`ReleaseHold` trick for steps is equivalent to a rewriting engine that records `(rule, position, before, after)` per application. A TS core can do this natively and more cleanly.
- Many-to-one matching (MatchPy, discrimination nets) matters for thousands of rules. For a solver with tens of rules it is premature. A rule index keyed on the head operator (`Add`, `Mul`, `Div`, …) would be enough.

### Gaps
- I did not verify Mathematica's internal rule-ordering heuristics (specific-before-general ordering of DownValues) from a primary source.
- I could not confirm whether SymPy has fully removed `sympy.integrals.rubi` in the latest release.

---

## 4. Ordered rewriting, termination orderings (LPO, KBO), and confluence checking as test-time validation

### Takeaway
Termination orderings and critical-pair analysis are the standard tools for proving that a rule set always reaches a unique normal form. A step-by-step solver deliberately uses non-confluent, strategy-controlled rules, so these tools are best used offline as tests. Use them to flag rule pairs that loop (e.g. `addNegToSub` vs `subToAddNeg`) or overlap ambiguously, not as runtime machinery.

### Cited Findings
- Path orderings are reduction orderings used in particular in Knuth–Bendix completion. LPO (Kamin–Lévy) is a lexicographic variant of Dershowitz's recursive path ordering. — [Wikipedia: Path ordering (term rewriting)](https://en.wikipedia.org/wiki/Path_ordering_(term_rewriting))
- KBO assigns a term a weight equal to the sum of its symbols' weights, and is described as the oldest reduction order. WPO unifies the two families: KBO is the summation-induced case and LPO the maximum-induced case. — [A Unified Ordering for Termination Proving (arXiv 1404.6245)](https://ar5iv.arxiv.org/html/1404.6245)
- Simplification orderings (monotonic, with the subterm property) cannot prove termination of self-embedding systems. — [Imperial College lecture notes on orderings](https://www.doc.ic.ac.uk/~kb/MACTHINGS/SLIDES/2013Notes/15LOrders4up13.pdf) (search summary)
- KBO has been extended to AC rewriting, which matters for completion modulo AC. — [Steinbach, SEKI SR-89-13](https://scidok.sulb.uni-saarland.de/bitstream/20.500.11880/36263/1/SEKI-Report-SR-89-13_Steinbach_Proving-termination-of-associative%3dcommutative-rewriting-systems-using-the-Knuth%3dBendix-ordering.pdf)
- Knuth–Bendix completion adds rules for non-convergent critical pairs and requires a termination ordering. — [Saarland SEKI SR-88-12](https://w2.cs.uni-saarland.de/SEKI/1988/sr8812.pdf) (search summary)
- Practical evidence that rule sets loop: mathsteps' `stepThrough` has an explicit infinite-loop guard. mathjs's `_simplify` detects cycles by storing every visited expression string in `visited` and stopping on a repeat. Metatheory.jl offers `FixpointNoCycle`. — [mathsteps stepThrough.js](https://github.com/google/mathsteps/blob/master/lib/simplifyExpression/stepThrough.js); [mathjs simplify.js](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js); [Metatheory.jl rewrite.md](https://github.com/JuliaSymbolics/Metatheory.jl/blob/master/docs/src/rewrite.md)
- mathjs uses deliberately inverse rule pairs within one pipeline. `'n-n1 -> n+-n1'` is commented "temporarily replace 'subtract' so we can further flatten the 'add' operator", and `'n*(n1^-1) -> n/n1'` is commented "undo replace 'divide'". Termination therefore depends on phase order, not on an ordering. — [mathjs simplify.js default rules](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)

### Inferences
- Practical test-time tooling for the solver:
  - (a) A property test that every strategy terminates within N steps on random expressions.
  - (b) A cycle detector that hashes visited expressions, as mathjs does.
  - (c) A cheap critical-pair-style check: for each pair of rules that both fire on the same randomly generated term, compute both results, normalize, and report pairs whose normal forms differ. That is a sampled local-confluence test.
  - (d) A size or weight measure, KBO-like, attached to rules tagged "simplifying". It asserts that each such step decreases weight; rules tagged "expanding", such as `distribute`, are exempt. CortexJS already does this at runtime with its `RulePurpose` cost gate (§5).
- Full symbolic critical-pair computation needs unification over the rule patterns, which is nontrivial modulo AC. It is probably not worth implementing. Sampling-based checks give most of the value.

### Gaps
- I found no source showing a step-by-step educational solver that uses formal termination or confluence proofs. This appears not to be done in practice.
- I did not fetch primary texts (Baader & Nipkow; Knuth–Bendix 1970; Huet 1980), so the critical-pair lemma is stated here from background knowledge only.

---

## 5. Existing JS/TS libraries: mathjs, Algebrite, nerdamer, CortexJS Compute Engine, mathsteps, and maintenance status (2026)

### Takeaway
Two JS/TS projects are actively maintained with rule systems: mathjs (`simplify` rules) and CortexJS Compute Engine. CortexJS is the most relevant design reference: it is TypeScript, has a rule DSL with conditions, rule IDs, a `RuleStep {value, because, substeps}` trace type and `expr.explain()`. mathsteps is the only purpose-built JS step-by-step simplifier. It is archived, and its architecture is a near-twin of the current solver.

### Cited Findings

**mathjs**
- Status: v15.2.0, last commit 2026-11-06, active. — [GitHub josdejong/mathjs](https://github.com/josdejong/mathjs) (git log / package.json)
- Rule syntax:
  - String form: `'n1*n3 + n2*n3 -> (n1+n2)*n3'`.
  - Object form: `{l, r}` or `{s}`.
  - Plain functions are also accepted.
  - Wildcards are named by prefix: `n` any node, `c`/`cl` constant literal, `cd` decimal, `ce` constant expression, `v` non-constant, `vl` variable literal, `vd`, `ve`.

  — [mathjs simplify.js docstring](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)
- Rule options:
  - `repeat`: reapply this rule until stable.
  - `assuming`: a context that must match for the rule to apply.
  - `imposeContext`: overrides the context for matches.
  - `evaluate` (e.g. `{ l: 'c1+c2', r: 'c3', evaluate: 'c3 = c1 + c2' }`).
  - Context properties: `commutative`, `associative`, `total`, `trivial`. Built-in contexts `realContext` and `positiveContext` block e.g. `x/x → 1`.

  — [mathjs simplify.js](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)
- Application semantics: "A list of rules are applied to an expression, repeating over the list until no further changes are made." Each rule in `_simplify` is applied bottom-up to every node in one pass: `applyRule` maps over children first, then tries the node. The rule list loops until the stringified expression repeats. `consoleDebug` prints "Applying <rule> produced <expr>". That is the only built-in trace, and it is not a structured step list. — [mathjs simplify.js](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)

**CortexJS Compute Engine**
- Status: v0.182.0, last commit 2026-11-06, very active. — [GitHub cortex-js/compute-engine](https://github.com/cortex-js/compute-engine) (git log / package.json)
- Rule object fields: `match` (LaTeX, MathJSON, or expression), `replace` (expression or function), `condition` (LaTeX or function), `useVariations`, `purpose`, `id`, and `onBeforeMatch`/`onMatch` hooks. String rules take the form `a + b -> c; a > 0`, with per-wildcard conditions as `:cond1,cond2` or `_{cond}`. — [compute-engine `types-kernel-evaluation.ts`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-evaluation.ts); [`boxed-expression/rules.ts`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/boxed-expression/rules.ts)
- `RuleStep = { value, because /* id of the rule */, purpose?, substeps? }`. Substeps are "populated only when a trace consumer asks for it (expr.explain()); plain simplify() never allocates it." — [types-kernel-evaluation.ts](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-evaluation.ts)
- `RulePurpose` has three values:
  - `'simplify'`: the result must pass a cost gate; results that grow the expression are discarded.
  - `'transform'`: exempt from the gate.
  - `'expand'`: skipped by `simplify()`, but reachable via `replace()`.

  — [types-kernel-evaluation.ts](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-evaluation.ts)
- `ReplaceOptions`: `recursive`, `once` ("stop after the first matching rule"), `useVariations`, `matchPermutations`, `iterationLimit`, `form` (`'canonical'|'structural'|'raw'`), and traversal `direction` (`'left-right'` post-order LRN default, or `'right-left'`). — [types-kernel-serialization.ts](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-serialization.ts)
- Conditions are fail-closed. The source comment: "an unprovable predicate (e.g. `w ≠ 0` for an unconstrained `w`) must NOT satisfy the guard." — [rules.ts `conditionHolds`](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/boxed-expression/rules.ts)

**mathsteps (socratic/Google)**
- Archived by its owner on 2024-08-29. The last commit is 2023-06-26, a README update. It has about 2.2k stars and 279 forks. — [GitHub google/mathsteps](https://github.com/google/mathsteps)
- API: `simplifyExpression` and `solveEquation` return step arrays. Each step has `oldNode, changeType, newNode, substeps` (equations use `oldEquation/newEquation`). `ChangeTypes` is an enum of 79 entries, e.g. `ADD_POLYNOMIAL_TERMS`, `SIMPLIFY_LEFT_SIDE`. — [mathsteps README, `lib/ChangeTypes.js`](https://github.com/google/mathsteps)
- Architecture:
  - It is built on mathjs node types.
  - Each "search" module (e.g. `basicsSearch` with `removeMultiplicationByOne`, `reduceExponentByZero`, `simplifyDoubleUnaryMinus`…) is wrapped with `TreeSearch.preOrder`/`postOrder`.
  - `step()` flattens operands, removes unnecessary parens, and tries the searches in fixed priority. The first change becomes the step.

  — [mathsteps `lib/simplifyExpression/stepThrough.js`, `lib/TreeSearch.js`](https://github.com/google/mathsteps)
- ROADMAP.md says the target was questions from the Socratic app. Its coverage breakdown: factoring 22.84%, solve equation 17.99%, systems 6.34%, negative exponents 1.96%. — [mathsteps ROADMAP.md](https://github.com/google/mathsteps/blob/master/ROADMAP.md)

**Algebrite and nerdamer**
- Algebrite: v1.3.1, last commit 2022-03-21, dormant. — [GitHub davidedc/Algebrite](https://github.com/davidedc/Algebrite) (git log)
- nerdamer: v2.0.1 in package.json, with a commit on 2026-11-01. I only saw one shallow-clone commit, so I can't characterize activity beyond "had a commit recently". — [GitHub jiggzson/nerdamer](https://github.com/jiggzson/nerdamer) (git log)

**Other rewriters for comparison**
- SymbolicUtils.jl: last commit 2026-11-04, active. — [GitHub JuliaSymbolics/SymbolicUtils.jl](https://github.com/JuliaSymbolics/SymbolicUtils.jl)
- Metatheory.jl: last commit 2026-09-26, active. — [GitHub JuliaSymbolics/Metatheory.jl](https://github.com/JuliaSymbolics/Metatheory.jl)

### Inferences
- mathsteps is structurally almost identical to today's solver: priority-ordered imperative transforms, a tree search that returns on the first change, a fixed-point loop with a step cap, and an enum of change types. Its archival (whatever the business reason) left a hand-coded, 79-change-type JS codebase with no declarative rule layer. That is the maintenance shape the solver risks converging on.
- CortexJS is the closest TS precedent for the target design, though it is a full CAS and too heavy to embed for this purpose. The ideas to borrow:
  - rule `id` → step message (`because`);
  - `purpose` tags to separate simplifying from expanding rules;
  - fail-closed conditions;
  - opt-in `substeps`;
  - `once`/`iterationLimit`/`direction` as explicit strategy knobs.
- mathjs's rule DSL is concise (`'n1*n3 + n2*n3 -> (n1+n2)*n3'`). However, it applies a rule everywhere in one pass, it lacks per-application tracing, and it round-trips between binary and n-ary forms. All three make it a poor fit for one-step-at-a-time display.

### Gaps
- No source gives the reason mathsteps was abandoned. The repo and README give no rationale; only the archive notice exists. Any explanation (e.g. Socratic's absorption into Google) is unsourced here.
- Couldn't load cortexjs.io or mathjs.org docs pages (blocked). The findings come from source code instead.

---

## 6. Rule declaration DSLs (`a*(b+c) -> a*b + a*c` with side conditions) and attaching step messages to rules

### Takeaway
Every surveyed system writes rules the same way: a pattern with named wildcards, a template, optional guards, and an optional name. None of the classical engines carry pedagogical messages natively. The systems that show steps (Rubi, CortexJS, mathsteps) do it by giving each rule an identifier, recording `(id, before, after)` on each application, and formatting afterward. For the solver, a rule record of the form `{id, message, lhs, rhs | fn, where?, purpose?}`, applied by a tracing engine, fits the existing `Step` type directly.

### Cited Findings
- mathjs: `'n1*n3 + n2*n3 -> (n1+n2)*n3'`. Wildcard type is encoded in the variable-name prefix (`c` constant, `v` non-constant, …). The only side conditions are `assuming` contexts and `evaluate` for computed constants. — [mathjs simplify.js](https://github.com/josdejong/mathjs/blob/develop/src/function/algebra/simplify.js)
- CortexJS: `a + b -> c; a > 0` (condition after `;`), and per-wildcard conditions such as `:integer` shortcuts that "may expand to several comma-separated conditions". It also has an `id` and a `RuleStep.because` "id of the rule". — [compute-engine rules.ts, types-kernel-evaluation.ts](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/boxed-expression/rules.ts)
- SymbolicUtils: `@rule ~x * +(~~ys) => …` with `~x::pred` guards. `=>` evaluates the RHS. — [SymbolicUtils rewrite.md](https://github.com/JuliaSymbolics/SymbolicUtils.jl/blob/master/docs/src/manual/rewrite.md)
- Metatheory: `-->` is symbolic, `=>` is dynamic. `@slots` / `@rule x y …` declare pattern variables explicitly instead of using a `~` prefix. — [Metatheory.jl rewrite.md](https://github.com/JuliaSymbolics/Metatheory.jl/blob/master/docs/src/rewrite.md)
- Rubi: each rule is `lhs` with `Blank`/`BlankOptional` (defaulted wildcards such as `a_.` for coefficient 1), plus a `condition` (`FreeQ[{a,b},x] && NeQ[m,-1]`) and local `With` bindings. Steps display the rule and its conditions. — [compute-engine rubi-rules-data.json](https://github.com/cortex-js/compute-engine/tree/main/src/compute-engine/rubi); [Rubi README](https://github.com/RuleBasedIntegration/Rubi)
- mathsteps: no DSL. Each rule is a JS function returning a `Node.Status` with a `ChangeTypes` enum value. A `Status.childChanged` wrapper propagates the change upward with its index. — [mathsteps `lib/TreeSearch.js`](https://github.com/google/mathsteps/blob/master/lib/TreeSearch.js)

### Inferences
- A proposed TS shape, which fits the existing `Step` type and is my synthesis, not an existing library:
  ```ts
  rule({
    id: 'distribute',
    message: 'distribute',                 // must be a member of Step['message'] union → type-checked
    lhs: 'a * (...terms +)',               // or a typed builder: mul(v('a'), add(seq('terms')))
    rhs: ({a, terms}) => add(...terms.map(t => mul(a, t))),
    where: ({a}) => !isZero(a),            // fail-closed guard (CortexJS style)
    purpose: 'expand',                     // lets a cost/weight test exempt it (CortexJS RulePurpose)
  })
  ```
  The strategy layer emits `{message, before, after, substeps}` at each successful application. Composite rules (e.g. collect-like-terms = reorder; factor; compute) can be `named(message, seq(...))` strategies whose inner steps become `substeps`.
- Prefer a typed builder API, or tagged-template parsing into the Semantic AST, over a string grammar with prefix-typed wildcards (mathjs style). TypeScript then checks message names against the `Step['message']` union, and wildcard predicates (`num`, `variable`, `nonZero`) stay explicit, not hidden in name prefixes.
- Keep an escape hatch for function-valued rules, as mathjs and CortexJS do. Some current transforms (`collectLikeTerms`, `reduceFraction`) are algorithmic (gcd, grouping) rather than single pattern rewrites.

### Gaps
- I found no surveyed system that attaches human-readable pedagogical messages, as distinct from rule IDs, directly to declarative rules. That appears to be left to the application layer.

---

## Cross-cutting comparison with e-graphs (brief, within scope)

### Takeaway
Classical strategy-controlled rewriting keeps a single current term and an explicit order of rule firings, so the sequence of steps can be shown to the student directly. Equality saturation (e-graphs) explores all rewrites at once and extracts a best term by cost. That suits finding an optimal final form. Recovering a human-readable step sequence afterward requires extra machinery.

### Cited Findings
- Metatheory.jl supports both modes from one rule syntax. Bidirectional `==` rules work only with e-graphs, and classical rewriting needs directed `-->`/`=>` rules. — [Metatheory.jl rewrite.md](https://github.com/JuliaSymbolics/Metatheory.jl/blob/master/docs/src/rewrite.md)
- CortexJS's classical engine shows how a cost function is applied in classical rewriting: a "cost gate" in which simplify-purpose rule results "that grow the expression are discarded". That is a local greedy version of e-graph extraction. — [compute-engine types-kernel-evaluation.ts](https://github.com/cortex-js/compute-engine/blob/main/src/compute-engine/types-kernel-evaluation.ts)

### Inferences
- A hybrid is plausible:
  - Classical strategies produce the displayed steps.
  - An e-graph, if used at all, serves as an oracle. It can check that two forms are equal, or choose a target form, and the strategy engine then walks toward that target with explainable steps.
- The same rule records could feed both engines if rules are declared as data (lhs/rhs patterns) rather than opaque functions.

### Gaps
- E-graph proof/explanation production (e.g. egg's explanations feature) was out of scope and not researched here. Another researcher's notes should cover it.
