# Automated Geometry Reasoning for @math-blocks/solver

Research date: 2026-11-07. Method note: arxiv.org, nature.com, pmc.ncbi.nlm.nih.gov, philipzucker.com and geogebra.github.io could not be reached from this session (DNS blocked). Many arXiv and Nature findings below therefore come from search-result snippets and secondary summaries rather than full-text reads. Those findings are flagged. GitHub pages were fetched directly.

## 1. Algebraic methods (Wu's method, Gröbner bases): power vs. readability

### Takeaway
Wu's method and Gröbner bases (Buchberger) are powerful decision procedures. They work by translating a construction into polynomial equations, so the "proof" is polynomial manipulation that a student can't read. They are useful as a hidden oracle: to check that a conjecture is true, or to find degeneracy conditions. They are not a source of tutoring steps. GeoGebra's tools confirm the pattern: they return true/false plus degeneracy conditions, not a derivation.

### Cited Findings
- On IMO-AG-30, Wu's method solved 10 of 30 problems, the previous best, against AlphaGeometry's 25. The paper is quoted as saying the "classic method solves just 4 problems less than AlphaGeometry" when combined, and a preprint copy says AlphaGeometry plus Wu's method solves 27/30. I could not check that against the Nature text. — [DeepMind blog, Jan 17 2024](https://deepmind.google/discover/blog/alphageometry-an-olympiad-level-ai-system-for-geometry/); [Google Research pub page](https://research.google/pubs/solving-olympiad-geometry-without-human-demonstrations/); [LessWrong discussion](https://www.greaterwrong.com/posts/GGLpjugLQv6TupQgS/alphageometry-an-olympiad-level-ai-system-for-geometry)
- GeoGebra can choose among the Gröbner basis method, Wu's characteristic set method, the area method, and the "Recio method" of exact verification. — [ATCM 2020 invited paper (Kovács et al.)](https://atcm.mathandtech.org/EP2020/invited/21786.pdf)
- GeoGebra's Gröbner computations run in the Giac CAS embedded in GeoGebra. — [Kovács, "GeoGebra Discovery in Context" (2022)](https://ar5iv.labs.arxiv.org/html/2201.07362)
- Gröbner bases can give an incomplete algebraic translation because they handle inequalities poorly. A 2023 update to ProveDetails in GeoGebra Discovery instead uses Tarski/QEPCAD (real quantifier elimination). — [Brown, Kovács, Luksch, Recio, Vajda, Vélez, CEUR Vol-3455 (2023)](https://ceur-ws.org/Vol-3455/short2.pdf)
- Botana et al. (J. Automated Reasoning, 2015) report that many complex theorems are proved in under a second in GeoGebra. — [ATP in GeoGebra summary](https://bohrium.dp.tech/paper/arxiv/1307.1942)

### Inferences
- Algebraic provers fit the solver as a **verifier or discovery oracle**, for example to confirm that a step the student proposes is valid or that a goal holds. They do not generate steps. Their output (polynomial remainders, non-degeneracy conditions) would need its own explanation layer, which is not practical for school students.
- Coordinate geometry (distance, slope, midpoint, line equations) is the exception. There the algebraic translation *is* the expected student method, and the existing algebra stepper can already narrate it.

### Gaps
- I could not reach the Nature full text to confirm the full-angle (2), Gröbner (4), DD (7), DD+AR (14) and DD+AR+heuristics (18) baseline counts I recall from the paper's table. Treat those numbers as unverified.
- I found no maintained npm Gröbner basis package. The closest is a GitHub JS project, [Daniel2000815/multivariate-polynomial](https://github.com/Daniel2000815/multivariate-polynomial), which exposes `Polynomial.buchberger([f, g])` over Q, but its npm status and quality are unverified. Giac (the engine inside GeoGebra) has a JS/WASM build, but I did not confirm its current packaging or license in this session.

## 2. Readable-proof methods: area method, full-angle, deductive database, GeoGebra ART, JGEX, FormalGeo, datasets

### Takeaway
Synthetic methods from the Chou–Gao–Zhang line produce human-readable proofs:
- the **area method** (1994), which eliminates points using signed-area and Pythagorean-difference lemmas;
- the **full-angle method** (1996);
- the **deductive database (DD)** (JAR 2000), which forward-chains rules to a fixpoint.

DD-style forward chaining over predicates (para, perp, cong, cyclic, eqangle, simtri…) produces exactly the "statement / reason" pairs of a two-column proof, so it is the best match for a tutor. FormalGeo's 88 predicates and 196 theorems with recorded theorem sequences, and Inter-GPS/Geometry3K, are the closest open "school geometry" theorem libraries.

### Cited Findings
- **Area method:** *Machine Proofs in Geometry* (Chou, Gao, Zhang, 1994) presents a decision procedure for constructive theorems in Euclidean plane geometry based on signed area and Pythagorean differences, producing short readable proofs. The program generated readable proofs of more than 400 difficult theorems. — [Chou/Gao/Zhang JAR 1996 "Automated generation of readable proofs with geometric invariants"](https://typeset.io/pdf/automated-generation-of-readable-proofs-with-geometric-320ev9mx51.pdf); [Narboux area method page](https://www.irif.fr/~narboux/area_method.html)
- The area method is formalized in Coq/Rocq as `coq-area-method`, by Narboux. — [Rocq package](https://rocq-prover.org/p/coq-area-method)
- Quaresma and Graziani (JAR, 2022/23) propose measuring readability of area-method proofs by the size of the largest polynomial term. In other words, area-method proofs can still contain large algebraic expressions. — [Springer PDF](https://link.springer.com/content/pdf/10.1007/s10817-022-09652-0.pdf)
- **Full-angle method:** Chou/Gao/Zhang, JAR vol. 17 (1996), pp. 349–370. Ye, Chou and Gao (JAR 45, 2010) used the full-angle and DD methods for visual proof presentation. — [dblp](https://dblp.uni-trier.de/rec/journals/jar/YeCG10a.html); [Bohrium DD paper record](https://www.bohrium.com/paper-details/a-deductive-database-approach-to-automated-geometry-theorem-proving-and-discovering/812433538853896194-2538)
- **Deductive database:** Chou, Gao and Zhang, "A Deductive Database Approach to Automated Geometry Theorem Proving and Discovering", J. Automated Reasoning 25 (2000), 219–246. Given a configuration, it computes the fixpoint under a fixed set of geometric rules (area- and full-angle-related lemmas). A *structured* database reduces database size "by one hundred times". — [Bohrium record](https://www.bohrium.com/paper-details/a-deductive-database-approach-to-automated-geometry-theorem-proving-and-discovering/812433538853896194-2538); [unpaywall DOI 10.1023/A:1006171315513](https://unpaywall.org/10.1023%2FA%3A1006171315513)
- Later Olympiad systems (e.g. GenesisGeo) describe their DDAR as adopting "a structured deductive engine (Chou et al., 2000; Sturm and Zengler, 2011) that incrementally expands the deductive closure of all provable statements". — [GenesisGeo technical report (arXiv 2509.21896)](https://arxiv.org/html/2509.21896v2)
- **GeoGebra ART:** the tools are Prove, ProveDetails, LocusEquation, Envelope, the extended Relation tool, and Discover. Discover finds all statements that hold for one selected element of a figure. — [GeoGebra Book "Automated Reasoning Tools in GeoGebra"](https://ggbm.at/McEqwQNb); [Kovács 2022](https://ar5iv.labs.arxiv.org/html/2201.07362)
- **JGEX:** Newclid accepts JGEX problem strings or files (`newclid jgex`) as well as GeoGebra `.ggb` files (`newclid ggb --file ... --goals ...`). — [Newclid GitHub](https://github.com/LMCRC/Newclid)
- **FormalGeo** (Zhang et al., arXiv 2310.18021, v6 Feb 2024):
  - 88 geometric predicates and 196 theorems.
  - The FGPS solver, written in Python, works as both an interactive verifier and an automatic solver.
  - FormalGeo7K has 6,981 problems, each annotated with natural language, a diagram, formal CDL and a theorem sequence. Augmented counts differ by version: 133,818 or 186,832.
  - FormalGeo-IMO is a smaller, harder set.
  - Unguided FGPS search often times out. The FGeo-TP theorem predictor raised the solve rate from 39.7% to 80.86%.
  — [FormalGeo arXiv 2310.18021](https://arxiv.org/pdf/2310.18021); [FGeo-TP arXiv 2402.09047](https://www.arxiv.org/pdf/2402.09047); [MDPI Symmetry 16(4):421](https://mdpi.com/2073-8994/16/4/421)
- **Inter-GPS / Geometry3K** (Lu et al., ACL 2021):
  - Parses text and diagram into a formal language.
  - Encodes theorem knowledge as conditional rules and reasons symbolically step by step.
  - Geometry3K has 3,002 problems annotated in formal language.
  — [arXiv 2105.04165](https://arxiv.org/abs/2105.04165v2); [ACL anthology](https://preview.aclanthology.org/setup/2021.acl-long.528)
- **GeoQA:** 4,998 problems annotated with solving programs, 25 times larger than GeoS. — [search snippet for GeoQA, via Inter-GPS/related listings](https://www.wizwand.com/task/geometry-problem-solving)

### Inferences
- Geometry3K, GeoQA and FormalGeo7K are mostly *calculation* problems (find an angle or length) at high-school level. That makes them better test suites for a tutor than IMO-AG-30. FormalGeo's theorem-sequence annotations are close to ready-made "expected step sequences".
- The area method is readable in principle, but its steps (signed-area ratios) are not how school students are taught. For a K-12 tutor, a DD / full-angle style rule base using textbook theorem names (alternate interior angles, SAS, inscribed angle) fits better.

### Gaps
- I found no source for UniGeo's size or provenance; it appears only on leaderboards. GeoGebra ProveDetails' exact output format is unconfirmed (the manual page was blocked). From memory, it returns `{true, {"AreCollinear[A,B,C]", ...}}`-style lists of non-degeneracy conditions, but this is unverified.
- I did not check JGEX's (Java Geometry Expert, Ye/Chou/Gao) current maintenance status, or GeoLogic, in this session.

## 3. AlphaGeometry (2024), AlphaGeometry2 (2025) and open reimplementations (2024–2026)

### Takeaway
**AlphaGeometry** (Nature, Jan 17 2024) pairs a symbolic engine **DDAR** with a language model that proposes auxiliary points. DDAR is DD forward chaining over 43 Horn-clause rules plus AR, a linear-algebra engine over angles, ratios and distances. AlphaGeometry solved 25/30 IMO-AG-30 problems.

**AlphaGeometry2** (arXiv 2502.03544, Feb 2025):
- solves 84% of IMO 2000–2024 geometry problems;
- has a richer language and a much faster C++ DDAR.

Open DDAR code exists for both. Newclid (Nov 2024) is the most usable refactor. TongGeometry (Nature Machine Intelligence, Jan 2026), GenesisGeo (2025) and HAGeo (Nov 2025, CPU-only heuristics, 28/30) are later systems. The symbolic core is a saturation engine, the same shape as Datalog or e-graph equality saturation.

### Cited Findings
- **AlphaGeometry results:** 25/30 olympiad problems against 10 for the previous best method. The average IMO gold medallist solves 25.9. — [DeepMind blog, Jan 17 2024](https://deepmind.google/discover/blog/alphageometry-an-olympiad-level-ai-system-for-geometry/); [Google Research](https://research.google/pubs/solving-olympiad-geometry-without-human-demonstrations/)
- **AlphaGeometry training data:** 1 billion random diagrams were processed by "symbolic deduction and traceback" into 100M unique synthetic examples, with no human demonstrations. This comes from secondary press coverage. — [AI News](https://www.artificialintelligence-news.com/news/deepmind-alphageometry-solves-complex-geometry-problems/)
- **Open-source repo (google-deepmind/alphageometry):**
  - Code for both DD+AR and AlphaGeometry, under Apache-2.0. LM checkpoints and vocabulary are CC BY 4.0. Python 3.10.
  - DDAR runs without the LM dependencies (meliad, sentencepiece).
  - A separate `alphageometry2` repo hosts the AG2 DDAR code.
  - `defs.txt` defines constructions and `rules.txt` holds the deduction rules.
  - Problem syntax example: `a b c = triangle a b c; d = on_tline d b a c, on_tline d c a b ? perp a d b c`.
  - Proof output has three sections ("From theorem premises", "Auxiliary Constructions", "Proof steps"). Each step is numbered, cites the premises it uses as `[02]`, and gives its conclusion after `⇒`.
  — [GitHub repo](https://github.com/google-deepmind/alphageometry)
- **`rules.txt` contents:** 43 rules over 21 predicates: perp, para, ncoll, npara, cong, cyclic, eqangle, eqangle6, eqratio, eqratio3, eqratio6, circle, midp, coll, sameside, contri, contri*, contri2, simtri, simtri*, simtri2. Example rules:
  - `cyclic A B P Q => eqangle P A P B Q A Q B`
  - `midp M A B, midp M C D => para A C B D`
  - `cong A B P Q, cong B C Q R, cong C A R P, ncoll A B C => contri* A B C P Q R` (SSS)
  — [rules.txt](https://raw.githubusercontent.com/google-deepmind/alphageometry/main/rules.txt)
- **AlphaGeometry2** (arXiv 2502.03544, Feb 2025), from secondary summaries since the arXiv page was blocked:
  - 84% of IMO 2000–2024 geometry problems solved (42/50), against AG1's 54%.
  - Language coverage of IMO problems rose from 66% to 88%, adding locus and non-constructive statements.
  - A Gemini-based LM proposes auxiliary constructions with top-k=32 sampling at temperature 1.0.
  - Multiple search trees share facts through a mechanism called SKEST.
  - DDAR2 adds "double point" reasoning and a C++ core. A third-party blog reports roughly 1180 s → 3.45 s on a benchmark, which is unverified.
  — [Emergent Mind summary](https://www.emergentmind.com/topics/alphageometry2-ag2); [Towards AI deep dive](https://pub.towardsai.net/alphageometry2-a-deep-dive-into-a-gold-medalist-ai-geometry-solver-f86f459f976a); [The Decoder](https://the-decoder.com/alphageometry2-deepmind-ai-outperforms-math-olympians-at-geometry-tasks/)
- **Newclid** (arXiv 2411.11938, Nov 18 2024; Sicca, Xia, Fédérico, Gorinski, Frieder, Jui):
  - The DDARN solver is a significant refactor and upgrade of DDAR.
  - Accepts GeoGebra input for educational use.
  - Adds metric concepts (segment length, angle) and theorems such as Pythagoras. The paper notes that AlphaGeometry has no concept of segment length.
  - Solves IMO 2008 P1B, which DDAR could not.
  — [arXiv listing via search](https://arxiv.org/abs/2411.11938)
- **Newclid's current repo:** Python, installed with `pip install newclid[yuclid]`. "yuclid" is a C++ component. Accepts GeoGebra and JGEX input, has a `write_proof_steps()` API, and ships notebooks including IMO 2025 P2. No JS or web component is listed. — [GitHub](https://github.com/LMCRC/Newclid); [PyPI](https://pypi.org/project/newclid/)
- **TongGeometry** ("Proposing and solving olympiad geometry with guided tree search", Peking University and BIGAI):
  - arXiv Dec 2024; published in Nature Machine Intelligence, January 2026.
  - Solved all of IMO-AG-30 with fine-tuned LLM guidance, on 32 CPU cores and one RTX 4090 in 38 minutes.
  - Generated 6.7B theorems that need auxiliary constructions.
  - Three of its problems were used in the 2024 Chinese MO (Beijing district).
  - The authors write that "we do not claim TongGeometry surpasses an average IMO gold medallist in geometry generally".
  — [Project page](https://yzhu.io/publication/iq2026nmi/); [BIGAI](https://www.bigai.ai/?p=9473); [SCMP via The Star](https://www.thestar.com.my/tech/tech-news/2026/01/30/chinese-ai-goes-next-level-in-geometry-at-a-top-us-maths-olympiad)
- **HAGeo** ("Gold-Medal-Level Olympiad Geometry Solving with Efficient Heuristic Auxiliary Constructions", Duan et al., Nov 27 2025; ACL 2026):
  - 28/30 on IMO-30 using heuristic auxiliary points (midpoint, reflection, foot of perpendicular, intersections), preferring points that lie non-trivially on lines or circles.
  - One summary says it runs on CPU only, without neural networks.
  - Also releases a 409-problem benchmark with human-assessed difficulty.
  — [arXiv 2512.00097](https://arxiv.org/abs/2512.00097v1); [UCLA bibliography](https://web.cs.ucla.edu/~kwchang/bibliography/duan2026gold)
- **GenesisGeo** (arXiv 2509.21896, 2025) calls Newclid a practical, extensible open-source alternative to AlphaGeometry and describes DDAR as incremental deductive closure. — [GenesisGeo](https://arxiv.org/html/2509.21896v2)

### Inferences
- **DDAR has the same structure as saturation.**
  - DD is bottom-up Datalog: Horn rules over relations, run to a fixpoint, with each derived fact keeping its dependencies for traceback.
  - AR keeps linear equations over angle variables (mod π), log-ratio variables and lengths, and closes them with Gaussian elimination. That is a "linear-arithmetic analysis" attached to the fact database.
  - This is the egglog pattern: relations, plus union-find for equal terms, plus lattice or analysis values, run under rule saturation.
- **Auxiliary constructions are the step outside saturation** (they add new terms). HAGeo's result suggests a small set of hand-written heuristics can stand in for an LM. That is relevant for a browser tutor with no model.
- **Practical implication:** reimplementing a DD rule base (around 40–200 rules) plus an AR Gaussian-elimination module in TypeScript is feasible. AlphaGeometry's `rules.txt` and FormalGeo's theorem list are ready-made rule sets to port. AG2-scale performance is not needed for school problems.

### Gaps
- I could not read the AG2 paper directly. Whether AG2's open DDAR code includes the C++ core, and under which license, is unverified. The AG1 AR details (Gaussian elimination over angles/ratios/distances, traceback) come from the task framing and my background knowledge of the paper, not from a fetched page.
- I did not confirm the license of TongGeometry's code or whether it is released.

## 4. Connection to e-graphs / egglog / Datalog

### Takeaway
I found **no published work using egglog for Euclidean geometry theorem proving**. The closest items are `egga` (geometric algebra simplification on egglog-python) and informal notes by Philip Zucker. The mapping is natural all the same:
- geometric facts become egglog relations;
- equal segment lengths and equal angles become e-class merges (union-find over `Len(A,B)` and `Angle(…)` terms);
- parallel lines become equivalence classes of directions;
- angle sums and ratio products become a linear-arithmetic analysis.

The weak spot is proof production. egglog has no proof extraction today, while a tutor needs DD-style dependency traceback.

### Cited Findings
- `egga` is a Python library for symbolic geometric (Clifford) algebra built on egglog's Python bindings, offering simplification and equality checks. — [socket.dev egga](https://socket.dev/pypi/package/egga)
- Philip Zucker's egglog notes list "Geometry" as a topic with a directed-lines example and describe egglog as "a more programmable and predictable quantifier instantiation engine". The page itself was blocked; this is from the search snippet. — [Zucker egglog notes](https://www.philipzucker.com/notes/Languages/egglog/)
- egglog-python ships a resolution theorem-proving example. — [egglog-python docs](https://egglog-python.readthedocs.io/latest/_sources/auto_examples/resolution.py.txt)
- A 2024 paper notes that egglog lacks proof extraction. — [export.arxiv.org 2501.02413 (search snippet)](https://export.arxiv.org/pdf/2501.02413)
- The DD approach is explicitly "fixpoint with respect to a fixed set of geometric rules" (Chou/Gao/Zhang 2000), which is Datalog semantics. — [Bohrium record](https://www.bohrium.com/paper-details/a-deductive-database-approach-to-automated-geometry-theorem-proving-and-discovering/812433538853896194-2538)

### Inferences
Suggested encoding for a TS rewriting core:
- **Points** are atoms. **Segments** are canonical terms `Seg(A,B)` with A<B.
- **Lines** are e-classes of `Line(A,B)` terms, merged by `coll`.
- **Directions** are e-classes merged by `para`. `perp` is a relation, or a direction plus a 90° offset.
- **Lengths** are e-classes, so `cong` is a union. **Angles** use full-angle `∠(l1,l2)` terms mod 180°, which makes eqangle a union.
- **AR** becomes an analysis or side table: a sparse rational matrix over angle and log-length variables with Gaussian elimination, merging classes when a row proves that two variables are equal.
- **Steps:** every union and relation insertion needs a justification record (rule name plus premise fact IDs). That is the DDAR traceback, and it maps directly to two-column "statement | reason" rows.
- **Fact store:** a plain Datalog-style indexed fact store with a hand-rolled union-find is simpler than a full e-graph for geometry. Most geometric "terms" are flat, so e-graph congruence closure over nested terms buys little, except for *metric expressions* (e.g. `AB^2 + BC^2`). Those could reuse the existing algebra rewriting core.
- **No suitable WASM path found:** I found no evidence of an egglog WASM/JS build suitable for this, and did not verify one.

### Gaps
- No empirical comparison exists between an egglog-based geometry prover and DDAR. Whether e-graph extraction (cheapest term) can be adapted to "shortest readable proof" for geometry is unexplored in the sources I found.

## 5. School-geometry tasks, method fit, two-column proofs, construction/diagram solving, JS/TS libraries

### Takeaway
For K-12 tutoring, the main tasks map to methods as follows:

| Task | Best-fit method |
|---|---|
| Angle chasing | DD rules plus linear angle equations (AR), naturally emitted as two-column steps |
| Congruence and similarity proofs | DD with SSS/SAS/ASA/AAS rules (AlphaGeometry has `contri`/`simtri` rules) |
| Length and area computation (Pythagoras, trig, similar-triangle ratios) | Derive equations geometrically, then solve them with the existing algebra solver (a Newclid-style metric extension) |
| Coordinate geometry | The existing algebra engine directly |
| Verification | Gröbner/Wu as a hidden checker |

For drawing, JSXGraph (MIT/LGPL, pure JS) is the permissive choice. GeoGebra's Apps API is powerful (it includes the Prove commands) but its license restricts commercial API use.

### Cited Findings
- **Congruence and similarity as rules:** AlphaGeometry's rules include SSS congruence (`cong…cong…cong…ncoll => contri*`) and similarity predicates (`simtri`, `simtri2`), so DD covers textbook congruence and similarity reasoning. — [rules.txt](https://raw.githubusercontent.com/google-deepmind/alphageometry/main/rules.txt)
- **Metric extension:** AlphaGeometry has no concept of segment length. Newclid adds length, angle and Pythagoras, which is what calculation problems need. — [Newclid arXiv 2411.11938](https://arxiv.org/abs/2411.11938)
- **Calculation datasets:** FormalGeo7K and Geometry3K are calculation-heavy datasets annotated with theorem sequences or formal rules, and Inter-GPS reasons step by step with conditional theorem rules. — [FormalGeo](https://arxiv.org/pdf/2310.18021); [Inter-GPS](https://arxiv.org/abs/2105.04165v2)
- **GeoGebra Apps API:**
  - `evalCommand(string)` runs any input-bar command (English names) and returns a boolean.
  - `evalCommandGetLabels` returns the labels of created objects.
  - `evalCommandCAS` returns CAS output.
  — [GeoGebra Apps API docs](https://wiki.geogebra.org/en/Reference:GeoGebra_Apps_API)
- **GeoGebra licensing:**
  - Free for non-commercial use only.
  - Deep API integration on a platform is a paid feature: roughly US$0.30 per end user per year, or a US$199/year startup tier.
  - Commercial use requires an agreement (office@geogebra.org).
  — [GeoGebra License](https://geogebra.org/license); [Software Licensing](https://geogebra.org/m/yumfrbjr)
- **JSXGraph:** pure JavaScript, no dependencies, dual-licensed LGPL or MIT. Renders interactive geometry in SVG or canvas with multi-touch support. — [JSXGraph GitHub](https://github.com/jsxgraph/jsxgraph)
- **Gröbner in JS:** no maintained npm package found. A small GitHub JS library has Buchberger over Q. — [multivariate-polynomial](https://github.com/Daniel2000815/multivariate-polynomial); [GitHub topic groebner-basis](https://www.github.com/topics/groebner-basis)

### Inferences
- **Two-column format:** DDAR-style output (numbered facts, premise references, rule name) is already a two-column proof. Facts become "statements" and rule names become "reasons", once rule names are mapped to textbook phrases such as "cyclic quad ⇒ inscribed angles equal" → "Angles subtending the same arc are equal".
  - Proposed Step shape for the solver: `{ statement: Fact, reason: TheoremId, premises: StepId[] }`.
  - Numeric sub-steps (solving `x + 2x + 30 = 180`) become nested algebra Steps from the existing core.
- **Problem input and diagrams:** a constructive language (AlphaGeometry `defs.txt` style: `triangle`, `on_tline`, `midpoint`, `foot`, `circle`) both specifies the problem and gives a direct construction procedure. Each point is computed from earlier points, so drawing needs no general constraint solver.
  - Numeric coordinates also enable **numerical checking** of candidate facts before symbolic proof. AlphaGeometry and DD-style systems use this to filter conjectures and to drive Discover-like "what is true here?" exploration.
  - Non-constructive statements, which AG2 added for 88% coverage, need a numeric constraint solver (e.g. Newton or least squares) only for those rarer cases.
- **Browser feasibility:** a TS DD+AR engine for school problems (tens of points, around 100 rules) should saturate in milliseconds. That is my extrapolation, since DDAR2's C++ core handles IMO problems in seconds. Algebraic verification could be done with numeric randomized checks, avoiding a heavy CAS in the browser.

### Gaps
- I could not confirm whether GeoGebra's Prove and ProveDetails are callable through `evalCommand` in the embedded web app, or whether ART commands are licensed differently. GeoGebra Discovery is a separate fork.
- I found no source on how often school curricula use the two-column format versus paragraph proofs, and no existing tutoring system documentation that maps DD rules to textbook reason names.
- Geometric constraint solving for sketch-based diagrams (e.g. the planegcs solver from FreeCAD compiled to WASM) was not researched in this session.
