# 12 — References

**Document owner:** Ahmed Yousef · **Status: Revised <2026-11-15> (atomic roadmap + defect fixes)**

Add every source as it is used. Reconstructing a bibliography in week 34 from memory is miserable and
produces gaps a reviewer will notice.

Citation style: **IEEE**, unless the Faculty specifies otherwise. Confirm with Dr. Hend before the
report draft in W31.

---

## 1. Data sources and taxonomies

**[1]** U.S. Department of Labor, Employment and Training Administration, *O\*NET Database*,
O\*NET Resource Center. Available: <https://www.onetcenter.org/database.html>
— Licensed **CC BY 4.0**. Used to seed the skill taxonomy, occupation→skill relations, and Technology
Skills. Attribution required in the application and the report. Record the exact release version used.

**[2]** European Commission, Directorate-General for Employment, Social Affairs and Inclusion,
*ESCO — European Skills, Competences, Qualifications and Occupations*.
Available: <https://esco.ec.europa.eu/en/use-esco/download>
— Free download in CSV, RDF, TTL, ODS, XML and JSON-LD across 28 languages. Used for occupation and
skill concepts and multilingual alias seeding. Record the dataset version.

**[3]** Lightcast, *Lightcast Skills Taxonomy (Open Skills)*.
Available: <https://lightcast.io/open-skills>
— A browsable taxonomy of 34,000+ skills, with API access on request. Consulted for skill naming
conventions. **Check the licence terms before including any of its data in the repository.**

---

## 2. Models and libraries

**[4]** N. Reimers and I. Gurevych, "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks,"
in *Proc. EMNLP-IJCNLP*, 2019.
— The method behind sentence-transformers. Cite for the embedding approach.

**[5]** *sentence-transformers/all-MiniLM-L6-v2*, Hugging Face model card.
Available: <https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2>
— 384-dimensional embeddings, ~23 M parameters, **Apache-2.0**. The embedding model used in Engine B.

**[6]** pgvector contributors, *pgvector: Open-source vector similarity search for Postgres*.
Available: <https://github.com/pgvector/pgvector>

**[7]** pgvector contributors, *pgvector-dotnet*.
Available: <https://github.com/pgvector/pgvector-dotnet>
— MIT-licensed. Supports Npgsql, Dapper and **EF Core** via `Pgvector.EntityFrameworkCore`. The basis
for [ADR-0001](adr/0001-database-and-vector-store.md).

**[8]** Y. A. Malkov and D. A. Yashunin, "Efficient and robust approximate nearest neighbor search
using Hierarchical Navigable Small World graphs," *IEEE TPAMI*, 2020.
— Reference for HNSW indexing of persisted vectors in PostgreSQL. Production recommendation retrieval is performed by FastAPI over vectors supplied by .NET, not by querying PostgreSQL directly.

---

## 3. Retrieval-augmented generation and LLM safety

**[9]** P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,"
in *Proc. NeurIPS*, 2020.
— The RAG formulation behind Engine C. Engine C retrieves from authored atomic learning content (`atom` title, summary, key concepts, question) to answer student queries with deep links, ensuring grounded and verified answers.

**[10]** OWASP Foundation, *OWASP Top 10 for Large Language Model Applications*.
Available: <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
— The basis for the controls in [§06 4.5](06-ai-engines.md#45-prompt-injection-hardening). LLM01
(Prompt Injection) and LLM06 (Sensitive Information Disclosure) are the directly relevant items.

---

## 4. Evaluation methodology

**[11]** K. Järvelin and J. Kekäläinen, "Cumulated gain-based evaluation of IR techniques,"
*ACM Trans. Inf. Syst.*, vol. 20, no. 4, 2002.
— The definition of NDCG used in [RQ1](09-evaluation.md#rq1).

**[12]** J. Brooke, "SUS: A 'quick and dirty' usability scale," in *Usability Evaluation in Industry*,
Taylor & Francis, 1996.
— The System Usability Scale used in [RQ5](09-evaluation.md#rq5).

**[13]** A. Bangor, P. Kortum and J. Miller, "Determining what individual SUS scores mean: adding an
adjective rating scale," *J. Usability Studies*, vol. 4, no. 3, 2009.
— The source of the SUS ≥ 68 benchmark.

**[14]** J. Nielsen, "Why you only need to test with 5 users," Nielsen Norman Group, 2000.
Available: <https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/>
— Justification for the round-1 sample size.

**[15]** M. G. Kendall, "A New Measure of Rank Correlation," *Biometrika*, vol. 30, 1938.
— Kendall's τ, used for inter-rater agreement.

---

## 5. Standards and guidelines

**[16]** W3C, *Web Content Accessibility Guidelines (WCAG) 2.1*, W3C Recommendation, 2018.
Available: <https://www.w3.org/TR/WCAG21/>
— The target for [NFR-05](02-requirements.md#nfr-05--accessibility). Specifically incorporates Success Criterion 2.3.1 (Three Flashes or Below Threshold) and Success Criterion 2.3.3 (Animation from Interactions) for gamification animations and celebratory UI.

**[17]** Internet Engineering Task Force, *RFC 7519 — JSON Web Token (JWT)*, 2015.

**[18]** Internet Engineering Task Force, *RFC 9106 — Argon2 Memory-Hard Function for Password Hashing
and Proof-of-Work Applications*, 2021.

**[19]** OWASP Foundation, *Application Security Verification Standard (ASVS)*.
Available: <https://github.com/OWASP/ASVS>
— Reference for the authentication and authorization requirements.

---

## 6. Related systems

Cited as comparison points in [§01 6](01-project-overview.md#6-related-work). These are products
rather than literature, so cite them as web resources with an access date.

**[20]** *roadmap.sh — Developer Roadmaps*. Available: <https://roadmap.sh>

**[21]** LinkedIn, *LinkedIn Skills and Skill Assessments*.
Available: <https://www.linkedin.com/help/linkedin/answer/a507663>

**[22]** Coursera, *Coursera Career Academy / Skills Graph*. Available: <https://www.coursera.org>

**[23]** Duolingo, *Duolingo: Language Learning*. Available: <https://www.duolingo.com>

**[24]** Khan Academy, *Khan Academy: Mastery Learning Platform*. Available: <https://www.khanacademy.org>

**[25]** Codecademy, *Codecademy: Interactive Coding Tutorials*. Available: <https://www.codecademy.com>

**[26]** freeCodeCamp, *freeCodeCamp: Learn to Code for Free*. Available: <https://www.freecodecamp.org>

**[27]** boot.dev, *boot.dev: Learn Backend Development*. Available: <https://www.boot.dev>

**[28]** DataCamp, *DataCamp: Learn Data Science and AI Online*. Available: <https://www.datacamp.com>

**[29]** McGraw Hill, *ALEKS: Assessment and Learning in Knowledge Spaces*. Available: <https://www.aleks.com>

---

## 7. Knowledge tracing, spaced repetition, and gamification literature

The following citations support the pedagogical and algorithmic foundations of the atomic roadmap, spaced repetition, and engagement mechanics. *(Verify before citing in final report draft)*.

**[30]** B. Settles and B. Meeder, "A Trainable Spaced Repetition Model for Language Learning," in *Proc. 54th Annual Meeting of the Association for Computational Linguistics (ACL)*, 2016, pp. 1848–1858. *(verify before citing)*
— Half-life regression model powering Duolingo's spaced repetition system.

**[31]** A. T. Corbett and J. R. Anderson, "Knowledge tracing: Modeling the acquisition of procedural knowledge," *User Modeling and User-Adapted Interaction*, vol. 4, no. 4, pp. 253–278, 1995. *(verify before citing)*
— Classical Bayesian Knowledge Tracing (BKT) formulation establishing mastery thresholds across skill components.

**[32]** C. Piech, J. Bassen, J. Huang, S. Ganguli, M. Sahami, L. J. Guibas, and J. Sohl-Dickstein, "Deep Knowledge Tracing," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 28, 2015. *(verify before citing)*
— Recurrent neural network formulation of student knowledge state tracking.

**[33]** J.-P. Doignon and J.-C. Falmagne, *Knowledge Spaces*, Berlin: Springer-Verlag, 1999. *(verify before citing)*
— Mathematical foundation of prerequisite structures, surmise relations, and well-graded knowledge states over atomic learning items.

**[34]** S. Leitner, *So lernt man lernen: Der Weg zum Erfolg*, Freiburg: Herder, 1972. *(verify before citing)*
— The classical Leitner 3-box/5-box physical spaced-repetition card system, serving as the basis for the MVP 3-box review queue.

**[35]** P. A. Wozniak, "Optimization of learning," Master's thesis, University of Technology in Poznań, 1990. *(verify before citing)*
— Description of SuperMemo Algorithm 2 (SM-2) for interval calculation.

**[36]** J. Ye et al., *Free Spaced Repetition Scheduler (FSRS)*, Open Spaced Repetition Project, 2023. Available: <https://github.com/open-spaced-repetition/fsrs4anki> *(verify before citing)*
— Modern memory-state spaced repetition algorithm based on stability, retrievability, and difficulty; documented as post-MVP review scheduler upgrade.

**[37]** D. Dicheva, C. Dichev, G. Agre, and G. Angelova, "Gamification in Education: A Systematic Mapping Study," *Educational Technology & Society*, vol. 18, no. 3, pp. 75–88, 2015. *(verify before citing)*
— Peer-reviewed systematic mapping of gamification elements (points, badges, leaderboards, progression) and empirical outcomes in educational settings.

**[38]** J. Hamari, J. Koivisto, and H. Sarsa, "Does Gamification Work? — A Literature Review of Empirical Studies on Gamification," in *Proc. 47th Hawaii International Conference on System Sciences (HICSS)*, 2014, pp. 3025–3034. *(verify before citing)*
— Peer-reviewed review of empirical evidence for motivational affordances and behavioral engagement.

---

<a id="7-literature-check-schedule"></a>

## 8. To be added

Sources needed but not yet gathered, with an owner and a target week so they do not quietly disappear.

| Topic | Why needed | Owner | By |
|---|---|---|---|
| Academic work on skill-gap analysis in education | Positions the core contribution in the literature | Ahmed Yousef | W17 |
| Curriculum-to-competency mapping papers | Directly supports contribution #2 — the strongest novelty claim | Ahmed Yousef | W17 |
| Egypt / MENA IT labour-market reports | Justifies the regional weighting contribution | Abdelrahman | W20 |
| Learning-path sequencing and prerequisite-graph literature | Grounds the atomic sequence in prior work (beyond Doignon & Falmagne) | Osama | W20 |
| Self-assessment bias in student skill estimation | Motivates the 20-item placement assessment and validity discussion | Yousef Khaled | W20 |
| Verification of references [30]–[38] | Confirm page numbers, DOIs, and citation accuracy before report draft | Ahmed Yousef | W17 |
| Faculty citation-style requirement | Formatting the bibliography correctly the first time | Abdelrahman | W10 |

> The second row matters most. Curriculum-to-competency mapping is the project's clearest original
> claim, and a novelty claim is only credible once the literature has actually been checked. If prior
> work exists, we position against it; if it genuinely does not, that absence needs to have been
> searched for rather than assumed.

---

## 9. How to maintain this file

1. Add a source **when you use it**, not later.
2. Record the access date for anything web-based.
3. Record the **version** of every dataset and model — O\*NET releases, ESCO versions and model revisions all change over time.
4. Note the licence for anything whose data or code enters the repository.
5. Keep the numbering stable. Append new entries; never renumber existing ones, or every citation in the draft report breaks at once.

---

**Next:** [13 — Learning Experience](13-learning-experience.md)
