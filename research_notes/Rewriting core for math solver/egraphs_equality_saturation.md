# E-graphs and Equality Saturation as a Rewriting Core for @math-blocks/solver

Research note, 2026-11-07. Network caveat: uwplse.org, arxiv.org, docs.rs and compilers.cs.uni-saarland.de could not be fetched in this session (DNS blocked), so claims from those hosts come from search-result snippets rather than full-text reads. They are flagged where it matters.

## Core concepts (e-graphs, rebuilding, e-matching, egglog, analyses, conditional rewrites)

### Takeaway
An e-graph stores many equivalent forms of an expression at once, grouped into e-classes. Equality saturation applies every rule without destroying anything, then extracts one best term. egg (POPL 2021) made this fast with deferred "rebuilding" and pluggable e-class analyses. egglog (PLDI 2023) generalizes it to Datalog with merge/lattice functions. Constant folding and side conditions such as x≠0 are both supported, but this design answers "what is equivalent", not "what did a student do next".

### Cited Findings
- An e-graph is "a data structure to maintain an equivalence relation over expressions... a set of equivalence classes (e-classes), each of which contains equivalent e-nodes". Its primitives are `add` and `union`. — [egg tutorial: background](https://docs.rs/egg/latest/egg/tutorials/index.html)
- How a rewrite is applied: search the LHS to get pairs (c, σ), add r[σ], then union it with c. The process is "only additive, meaning that the e-graph never forgets old versions of terms". Saturation is reached when rewrites add no new information, and the loop stops at saturation or a timeout. — [egg tutorial](https://docs.rs/egg/latest/egg/tutorials/index.html)
- egg paper (Willsey et al., POPL 2021, "egg: Fast and Extensible Equality Saturation"):
  - It introduces rebuilding, which defers congruence-closure maintenance.
  - It introduces e-class analyses, which attach facts to e-classes.
  - It notes that past implementations "resorted to ad hoc e-graph manipulations to integrate... simple program analyses like constant folding".
  - Rewrites can depend on analysis facts, and the equalities they add establish new facts.
  - Source: [arXiv 2004.03082](https://arxiv.org/pdf/2004.03082)
- An e-class analysis annotates each e-class with an element of a join semilattice. — [ICDT 2025 paper (Dagstuhl)](https://drops.dagstuhl.de/storage/00lipics/lipics-vol328-icdt2025/html/LIPIcs.ICDT.2025.34/LIPIcs.ICDT.2025.34.html)
- Constant folding as an analysis: each e-class holds an optional constant. "If we find an expression equal to 3+1, we'll also know it to be equal to 4". Analysis data can also "inform rewrite conditions". — [hegg (Haskell egg port) README](https://hackage.haskell.org/package/hegg-0.6.0.0/src/README.md)
- egg's public API includes `ConditionalApplier` (an Applier that checks a Condition before applying) and `BackoffScheduler` (exponential rule backoff). This is how a conditional rule like x/x → 1 when x≠0 is written: the condition queries analysis data, such as a constant or interval analysis. — [egg API listing](https://docs.rs/egg/0.4.0/egg/all.html)
- Relational e-matching (Zhang, Wang, Willsey, Tatlock, POPL 2022):
  - It treats e-matching as conjunctive queries over a relational database and uses generic join, giving the first worst-case-optimal bound for e-matching.
  - It is "orders of magnitude faster" than egg's e-matcher.
  - It supports multi-patterns "for free".
  - Source: [arXiv 2108.02290](https://arxiv.org/abs/2108.02290); [POPL page](https://popl22.sigplan.org/details/POPL-2022-popl-research-papers/35/Relational-E-Matching)
- egglog (Zhang et al., PLDI 2023, "Better Together: Unifying Datalog and Equality Saturation"):
  - It is a fixpoint system that unifies Datalog and EqSat.
  - Data is stored as partial functions, and relations are unit-valued functions.
  - A `:merge` expression resolves conflicting outputs, for example `min` for a path length, which is a lattice join. egglog does not restrict merge to lattice joins.
  - It uses semi-naive evaluation.
  - The reported speedup over Soufflé on points-to differs between arXiv versions: 4.67× in v1 and 4.96× in a later version.
  - Source: [arXiv 2304.04332](https://arxiv.org/pdf/2304.04332); [PLDI page](https://pldi23.sigplan.org/details/pldi-2023-pldi/20/Better-Together-Unifying-Datalog-and-Equality-Saturation)
- egglog's current state (README):
  - The Rust crate is at `egglog = "3.0.0"`.
  - It supports multithreading (`-j`) and Graphviz/SVG output.
  - It compiles to WASM (`wasm-example`).
  - It has Python bindings (egglog-python) and an `egglog-experimental` plugin repo.
  - The repo shows about 2.8k commits and 876 stars.
  - The README does not mention proof or explanation support.
  - Source: [github.com/egraphs-good/egglog](https://github.com/egraphs-good/egglog)

### Inferences
- The solver's current `Step` model is destructive and sequential: each transform produces the next AST. An e-graph is non-destructive and order-free. Adopting it means splitting the solver into two layers. The first is "find equivalents and a target", which the e-graph is good at. The second is "linearize a readable path to it", which needs explanations or a separate search (see the extraction and explanation sections).
- A constant-folding analysis plus an interval or "known nonzero" analysis maps directly onto the guards the solver already needs, such as cancelling x/x or dividing both sides by a coefficient.

### Gaps
- I could not verify the often-quoted figure that rebuilding gives "up to 88×" speedup. The egg arXiv full text was not reachable.
- I did not confirm whether egglog 3.x has a stable proofs/explanations mode. The README does not mention one.

## Associativity/commutativity: blowup and mitigations

### Takeaway
Plain A/C rewrite rules make the number of e-nodes grow combinatorially (exponentially in the number of operands). This is the biggest practical obstacle for an algebra domain built on n-ary Add/Mul. Since 2025 the field has converged on handling AC natively: multiset or sorted containers in egglog (2026), AC-indexed relations (EGRAPHS 2026), and "semantic e-ids" (Zucker 2025). It no longer handles AC via rewrite rules. A TS port would need to bake canonical n-ary forms into the e-graph's hash-consing. That matches what math-blocks' n-ary AST already does.

### Cited Findings
- Rosin, Ullrich and Hack (EGRAPHS 2026) describe associativity and commutativity as rules "known to cause combinatorial blowup". They give bounds on AC blowup in standard e-graphs and propose AC-specific indexed relations for e-matching, with "asymptotically less memory" in some cases. Read from the search snippet only. — [Saarland PDF](https://compilers.cs.uni-saarland.de/papers/ullrich_egraphs2026-paper17.pdf)
- Egglog containers (UW PLSE blog, Feb 2026) represent sums as multisets or sorted lists, "so that we can represent a whole set of equal summations only with one multiset, instead of having to add many terms to the e-graph". Read from the search snippet only. — [UW PLSE: Custom Data Structures in E-Graphs](https://uwplse.org/2026/02/24/egglog-containers.html)
- Zucker, "Omelets Need Onions" (arXiv 2504.14340, Apr 2025) proposes bottom-up e-matching and "semantic e-ids" as a pragmatic route to e-graphs modulo theories, including AC. — [arXiv 2504.14340](https://arxiv.org/abs/2504.14340)
- Zucker's posts:
  - Brute-force AC handling leads to "exponential blowups".
  - AC matching inherently requires search and returns multiple substitutions.
  - Sources: [relational AC matching](https://philipzucker.com/relational-ac-matching); [AC hash-consing](https://www.philipzucker.com/ac_hashcons/)
- The EGRAPHS 2026 program lists "A Semi-Persistent E-Graph with Native AC Canonization and Leapfrog AC Matching" (Delmas). I did not read it. — [EGRAPHS 2026 program](https://pldi26.sigplan.org/program/program-egraphs-2026/)
- Rule scheduling: egg's `BackoffScheduler` exponentially backs off rules that fire too often. This is the standard way to keep A/C-like rules from dominating. — [egg API listing](https://docs.rs/egg/0.4.0/egg/all.html)
- Slotted e-graphs (Schneider, Rossel, Shaikhha, Goens, Köhler, Steuwer; PLDI 2025, DOI 10.1145/3729326) add first-class bound and free variables. Terms that differ only by variable names share one representation. This addresses binders and alpha-equivalence, not AC. It is less relevant to polynomial algebra but would matter for, say, integrals or sums with bound indices. — [PLDI 2025 page](https://pldi25.sigplan.org/details/pldi-2025-papers/77/Slotted-E-Graphs-First-Class-Support-for-Bound-Variables-in-E-Graphs); [EGRAPHS 2024 version](https://pldi24.sigplan.org/details/egraphs-2024-papers/10/Slotted-E-Graphs)
- Metatheory.jl's classical rewriting backend supports AC rules; that capability is inherited from the SymbolicUtils.jl pattern matcher. — [JOSS / Metatheory docs](https://docs.juliahub.com/Metatheory/Hi8Kc/1.0.0)

### Inferences
- The solver already stores Add/Mul as n-ary nodes. In a TS e-graph, the natural approach is to make the e-node for `Add` hold a sorted multiset of child e-class ids, i.e. AC-canonical hash-consing. Matching would then use multiset or AC matching rather than binary patterns. This avoids the classic blowup but means writing a custom matcher. Off-the-shelf egg-style pattern matching won't do it.
- Without AC-native nodes, an expression like 2x + 3 + 5x − 1 with commutativity and associativity rules would explode before "collect like terms" ever fires.

### Gaps
- I have no hard numbers from the 2026 papers (for example, e-node counts for an n-term sum). The full texts were blocked.

## Extraction: cost functions, greedy vs. ILP, and "most human-like next step"

### Takeaway
Extraction picks one term per e-class. Tree-cost bottom-up extraction is fast and exact. DAG cost is NP-hard and handled with ILP or heuristics. None of this tooling targets "the next pedagogical step". A tutoring solver would need a custom cost (for example, distance from the current expression plus a penalty on the rules used) or a search over explanation paths, rather than "smallest term".

### Cited Findings
- Comparison of extraction methods (extraction-gym framing):
  - Bottom-up extraction is fast but uses tree cost, so it can miss the minimum when the e-graph has sharing.
  - Greedy DAG extraction uses DAG cost but is not optimal.
  - ILP is optimal under DAG cost "but may not terminate".
  - Source: [Berkeley CS294-260 project](https://inst.eecs.berkeley.edu/~cs294-260/sp24/projects/mcts-extraction); [e-boost](https://arxiv.org/pdf/2508.13020)
- DAG-cost extraction is NP-hard. A blog post reports that Goharshady, Lam and Parreaux (OOPSLA 2024) showed it is hard to approximate within any constant factor. That attribution is secondary. — [Chugh blog](https://mohakchugh.is-a.dev/blog/egraph-extraction-dag-cost-cycles-treewidth)
- e-boost (ICCAD 2025) reports a 558× runtime speedup over ILP and a 19.04% improvement over the prior state of the art. — [e-boost PDF](https://www.csl.cornell.edu/~zhiruz/pdfs/eboost-iccad2025.pdf)
- An MCTS extractor gave costs only 0.1% lower than greedy DAG but ran about 1000× slower. — [Berkeley project](https://inst.eecs.berkeley.edu/~cs294-260/sp24/projects/mcts-extraction)
- egg ships an ILP extractor (`lp_extract`) that counts common subexpressions once. — [egg source](https://docs.rs/crate/egg/0.11.0/source/src/lp_extract.rs)

### Inferences
- In a solver, the "final answer" is usually something like a simplified polynomial or `x = c`. A simple tree-cost function (node count, plus penalties for unsimplified fractions and negative exponents) is enough to extract it in the browser. ILP is unnecessary and impractical in JS.
- To pick a "human-like next step", one option is to not extract a term at all. Instead, record which rule applications connect the current e-class representative to the target, and choose the path with the best pedagogical cost. That is really a shortest-path problem over the explanation graph, and it ties into the next section.

### Gaps
- I found no published work that extracts "pedagogically natural" intermediate steps from an e-graph.

## Explanations and proof production → tutoring steps

### Takeaway
egg can return an explanation: a chain of rule applications proving term A = term B. FMCAD 2022 made those proofs small with a greedy O(n log n) algorithm. This is the most direct bridge to `Step {message, before, after}`. However, explanations are minimal and congruence-based, not pedagogical: steps can be "backwards" or interleaved oddly. Lean-egg's experience shows reconstruction is fiddly.

### Cited Findings
- Flatt, Coward, Willsey, Tatlock, Panchekha, "Small Proofs from Congruence Closure" (FMCAD 2022, pp. 75–83):
  - Finding minimal congruence-closure proofs is NP-complete.
  - The paper gives an O(n^5) algorithm that is optimal under its tree-size metric, plus a practical O(n log n) greedy algorithm with no asymptotic overhead.
  - It was implemented in egg, "the first certifying equality saturation engine".
  - On 3,760 benchmarks it produced substantially smaller proofs than Z3.
  - Sources: [TU Wien PDF](https://repositum.tuwien.at/bitstream/20.500.12708/81325/1/Flatt-2022-Small%20Proofs%20from%20Congruence%20Closure-vor.pdf); [ar5iv](https://ar5iv.labs.arxiv.org/html/2209.03398)
- Follow-up: Andreotti and Barbosa (VMCAI 2026) port the technique to cvc5 and get shorter SMT proofs at a moderate runtime cost. — [VMCAI 2026](https://conf.researchr.org/details/VMCAI-2026/VMCAI-2026-papers/19/Producing-Shorter-Congruence-Closure-Proofs-in-a-State-of-the-Art-SMT-Solver)
- lean-egg (Rossel et al.) runs egg and reconstructs a Lean proof from the e-graph, which the Lean kernel checks:
  - It was used in Tao's Equational Theories Project.
  - The tactic is "partially unsound", but kernel checking catches errors.
  - The project hit "issues with the proof reconstruction" and worked around them by instantiating variables with terms from context.
  - Justifications are not fully handled, so needed rewrite steps can be lost.
  - The default saturation timeout is 3 s.
  - Sources: [Equational Theories blueprint](https://teorth.github.io/equational_theories/blueprint/egraphs-chapter.html); [Rossel et al. 2024, arXiv 2405.10188](https://ar5iv.labs.arxiv.org/html/2405.10188); [Lean Zulip](https://leanprover-community.github.io/archive/stream/474713-Lean-Together-2025/topic/Marcus.20Rossel.3A.20Egg.3A.20An.20Equality.20Saturation.20Tactic.20in.20Lean.html); [ETP paper arXiv 2512.07087](https://arxiv.org/pdf/2512.07087)

### Inferences
- From memory of egg's API, not re-verified this session because docs.rs was blocked: egg's "flat" explanation lists each intermediate term annotated with the rule used and its direction (forward or backward). That maps almost one-to-one onto `Step{message: ruleName, before, after}`.
- Mismatches with tutoring:
  1. Proofs may apply a rule backwards, which reads as un-simplifying.
  2. The order is the proof's order, not the order a teacher would use (for example, "distribute first, then collect").
  3. Each step is a single local rewrite, whereas math-blocks bundles steps into substeps such as "collect like terms" containing per-term substeps.
  4. Greedy small proofs optimize size, not readability.
- These mismatches mean a post-processing layer is needed: reorder or group steps by rule category, reject backward uses of "simplifying" rules, and synthesize parent steps. An alternative hybrid keeps the existing imperative transforms as the step generator and uses the e-graph only as an oracle, for example to check equivalence or to pick a target form.

### Gaps
- I found no paper or project that turns e-graph explanations into student-facing tutoring steps.
- I did not find egglog's current explanation/proof status.

## Real-world uses relevant to math (Herbie, Ruler/Enumo, Szalinski, Metatheory.jl, CAS)

### Takeaway
The math-adjacent successes are Herbie (floating-point rewriting), Ruler/Enumo (automatic rule synthesis), Metatheory.jl (Julia symbolic rewriting), and lean-egg (proofs). All of them optimize or prove; none produce step-by-step explanations for learners. Ruler/Enumo is the most directly reusable idea: it could synthesize or validate a math-blocks rule set offline.

### Cited Findings
- Herbie:
  - It switched its simplifier to egg. egg was about 100× faster than the old simplifier and made Herbie about 2× faster overall. — [Herbie 1.4 release notes](https://fpbench.cs.washington.edu/doc/1.4/release-notes.html)
  - By 2024 it is described as a "numerical compiler" that still uses egg for rewrite rules. — [UW PLSE, May 2024](https://uwplse.org/2024/05/09/Herbie-Numerical-Compiler.html)
  - egglog has been used for sound rewriting in the presence of division (EGRAPHS 2023). — [EGRAPHS 2023 talk](https://pldi23.sigplan.org/details/egraphs-2023-papers/7/egglog-In-Practice-Automatically-Improving-Floating-point-Error)
- Ruler (Nandi et al., OOPSLA 2021, Distinguished Paper): it infers rewrite rules with e-graphs and produces rule sets 5.8× smaller, 25× faster than a CVC4-based tool, "without compromising on proving power". — [SPLASH 2021](https://2021.splashcon.org/details/splash-2021-oopsla/23/Rewrite-Rule-Inference-Using-Equality-Saturation); [NSF PAR](https://par.nsf.gov/biblio/10330235-rewrite-rule-inference-using-equality-saturation)
- Enumo (Pal et al., OOPSLA 2023): a DSL for programmable theory exploration that guides rule inference. Its "fast-forwarding" strategy doesn't require evaluating terms, which opened domains prior work couldn't handle. — [NSF PAR](https://par.nsf.gov/biblio/10510243-equality-saturation-theory-exploration-la-carte); [ruler repo](https://github.com/mwillsey/ruler)
- Metatheory.jl:
  - It reimplements egg in pure Julia and handles non-terminating, non-confluent rule sets.
  - For real math simplification its docs point users to SymbolicUtils.jl.
  - The 3.0 branch is reported to be about 200× faster than 2.0.
  - The docs warn the manual is out of date.
  - Sources: [GitHub](https://github.com/JuliaSymbolics/Metatheory.jl); [arXiv 2102.07888](https://arxiv.org/pdf/2102.07888); [docs](https://docs.juliahub.com/Metatheory/Hi8Kc/1.0.0)

### Inferences
- Ruler/Enumo could run offline, in Rust, to check that math-blocks' hand-written rules are sound and complete over some term grammar, or to suggest missing identities. It does not need to ship to the browser.

### Gaps
- I did not research Szalinski (CAD) specifically. It is a known egg application but is not math-education relevant.
- I found no SymPy e-graph integration and no educational or step-by-step CAS built on e-graphs.

## JS/TS availability and browser feasibility

### Takeaway
There is no mature, maintained, general-purpose JS/TS e-graph library. The options are:
- a small niche port (`atsds-egg`);
- compiling egglog or egg to WASM, which works (there is an official browser demo) but is several MB and exposes a text/DSL interface;
- writing a few-hundred-line custom TS e-graph with AC-native n-ary nodes, which is likely the most practical route.

### Cited Findings
- npm options:
  - `atsds-egg` is a TS port of egg-style e-graphs (add, merge, rebuild, find with deferred congruence closure) tied to the `atsds` deductive-system term package. Its maturity is unknown.
  - `egraph-visualizer` is only a viewer (Cytoscape-based, about 38 weekly downloads).
  - The npm `egraph` package is unrelated graph drawing.
  - Sources: [pkgstats atsds-egg](https://www.pkgstats.com/pkg:atsds-egg); [npm egraph-visualizer](https://www.npmjs.com/package/egraph-visualizer); [yarn egraph](https://classic.yarnpkg.com/en/package/egraph)
- egglog in the browser:
  - The README says egglog compiles to WASM (`wasm-example`) and links a browser demo at egraphs-good.github.io/egglog. — [egglog README](https://github.com/egraphs-good/egglog)
  - The egglog-demo repo runs client-side with no server, is MIT-licensed, and is rebuilt nightly. — [egglog-demo](https://github.com/egraphs-good/egglog-demo)
  - A secondary source says the WASM binary "can be several MB" and that there is no filesystem, so programs are passed as strings. — [DeepWiki (secondary)](https://deepwiki.com/egraphs-good/egglog/2.4-python-and-webassembly)
- Other ports exist (hegg for Haskell, Metatheory.jl for Julia), which shows egg's design is portable to other languages. — [hegg](https://www.stackage.org/package/hegg); [Metatheory.jl](https://github.com/JuliaSymbolics/Metatheory.jl)

### Inferences
- A WASM egglog would force math-blocks to serialize its AST to egglog text, run it, and parse back extraction output. Explanations may not be available there. The bundle-size cost is significant for a browser editor.
- A custom TS e-graph, union-find plus hash-cons plus rebuild plus simple top-down e-matching, is a well-understood amount of code; hegg and Metatheory.jl are proof of portability. It could reuse math-blocks' existing node types and produce explanations natively by recording the reason for each union. Expected problem sizes (school algebra, under ~50 nodes) are tiny, so performance mainly depends on AC control, not raw speed.

### Gaps
- I found no benchmark of e-graph performance in JS engines, and no measured egglog WASM size.

## Limitations: termination, blowup, multi-step procedures, equation solving

### Takeaway
Saturation isn't guaranteed: expansive rules such as distribution or x → x·1 never saturate, so runs end by iteration, node or time limits. Procedural operations fit poorly as local rules: collecting like terms over n-ary sums, "do the same thing to both sides", choosing which variable to isolate. Solving for x is goal-directed search, not simplification. E-graphs are a better fit as a simplification and equivalence oracle than as the whole solver.

### Cited Findings
- egg's loop runs "while not saturated and no timeout". — [egg tutorial](https://docs.rs/egg/latest/egg/tutorials/index.html)
- Metatheory exposes match limits, e-class limits, a stop condition and a scheduler. It notes rule systems "need not be terminating or confluent". — [Metatheory docs](https://docs.juliahub.com/Metatheory/Hi8Kc/1.0.0); [JOSS](https://joss.theoj.org/papers/10.21105/joss.03078.pdf)
- lean-egg uses a 3 s default timeout, and multi-second proofs are usually spent in saturation. — [Lean Zulip](https://leanprover-community.github.io/archive/stream/474713-Lean-Together-2025/topic/Marcus.20Rossel.3A.20Egg.3A.20An.20Equality.20Saturation.20Tactic.20in.20Lean.html)
- Rules only instantiate on terms already in the e-graph; nothing is enumerated for every possible term. — [egglog-python tutorial](https://egglog-python.readthedocs.io/latest/tutorials/tut_1_basics.html)
- Herbie moved to "multi-phase rewriting" with egg. This is evidence that even flagship users stage rule sets rather than saturating everything at once. — [UW PLSE Herbie post](https://uwplse.org/2024/05/09/Herbie-Numerical-Compiler.html)
- AC rules cause combinatorial blowup. — [Rosin/Ullrich/Hack EGRAPHS 2026](https://compilers.cs.uni-saarland.de/papers/ullrich_egraphs2026-paper17.pdf)

### Inferences
- For math-blocks:
  - Equations can be modelled as an `Eq(lhs, rhs)` node with rules like `Eq(a+c, b) → Eq(a, b−c)`. Without goal direction ("isolate x"), saturation explores every rearrangement. A custom cost such as "x alone on one side" can select the answer, but the explanation path is not guaranteed to be the canonical textbook path.
  - Collecting like terms is natural as a dynamic or "computed RHS" rule over an AC-multiset node (Metatheory supports dynamic rules). Pure pattern rules handle it poorly.
  - Domain conditions (x≠0) need analyses or conditional appliers. Their results should be surfaced as caveats in the Steps.
- Recommended architecture to evaluate:
  - Keep the existing priority-ordered transforms as the pedagogy layer, the step generator.
  - Optionally add a small TS e-graph as a checker (validating that each Step's before ≡ after), as an oracle (finding the simplest equivalent form or detecting that the student's answer is equivalent), and as a source of alternative solution paths via explanations.
  - Use Ruler/Enumo offline to audit the rule set.

### Gaps
- I found no study measuring how readable e-graph-derived proofs are to humans or students.
- I found no published e-graph-based equation solver ("solve for x").
