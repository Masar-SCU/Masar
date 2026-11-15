# 15 — Open Decisions Log

**Document owner:** Abdelrahman · **Status: Created <2026-11-15> (atomic roadmap revision)**

This document tracks unresolved architectural, product, and operational decisions across the Masar graduation project. Each open decision has a clear question, evaluated options, a safe default position, a designated owner, and a hard resolution deadline ("Needed by").

If a decision remains unaddressed past its deadline, the project automatically adopts the **Default Option**, preventing stalled progress on the critical path.

---

## 1. Summary of Open Decisions

| ID | Topic / Question | Default Option | Owner | Needed By |
|---|---|---|---|---|
| **[OD-1](#od-1)** | Reranker model architecture | Learned ranker / lightweight heuristic over embeddings | Ahmed Yousef | **W19** (17 Jan 2027) |
| **[OD-2](#od-2)** | Include competitive leagues/quests in MVP | **No** (De-scoped to post-MVP; focus on streaks & daily goals) | Abdelrahman | **W12** (29 Nov 2026) |
| **[OD-3](#od-3)** | Mascot creation & visual style | Original vector mascot created by Yousef Khaled (no external trade dress) | Yousef Khaled | **W14** (13 Dec 2026) |
| **[OD-4](#od-4)** | Push / notification channel | **Email only** (strictly opt-in; no mobile push in MVP) | Mazen | **W14** (13 Dec 2026) |
| **[OD-5](#od-5)** | Hosting provider for static unit bundles | **Same static host as the SPA** (e.g., GitHub Pages or Vercel) | Mohamed Salah | **W11** (22 Nov 2026) |
| **[OD-6](#od-6)** | AI module backup person & workload | Pair Ahmed Yousef with Ziad for FastAPI/embeddings; descope advanced RAG | Abdelrahman | **W10** (15 Nov 2026) |
| **[OD-7](#od-7)** | Career depth if content authoring falls behind | **Full depth for 3 core tracks** (Backend, Frontend, Data); outlines for rest | Osama | **W23** (27 Feb 2027) |
| **[OD-8](#od-8)** | Arabic translation for learning atoms in MVP | **English-only for tech atoms**; bilingual UI navigation only | Yousef Khaled | **W18** (23 Jan 2027) |
| **[OD-9](#od-9)** | Zero-cost transactional email sender | **Resend / Brevo free tier** (300 emails/day cap) | Mohamed Salah | **W12** (29 Nov 2026) |
| **[OD-10](#od-10)** | Deprecation handling for legacy `/api/roadmap` | **Return HTTP 410 Gone** with pointer to `/api/path` | Mohamed Yasser | **W10** (15 Nov 2026) |

---

## 2. Detailed Decision Records

<a id="od-1"></a>
### OD-1 — Career recommendation reranker approach
- **Question:** What reranker architecture should Engine B use in FastAPI for the second stage of career recommendation?
- **Options Considered:**
  1. *Zero-shot Cross-Encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`):* High semantic ranking accuracy, but exceeds memory and latency constraints on free-tier CPU hosting (> 1.2s inference).
  2. *Lightweight Learned Linear / GBDT Ranker:* Trains quickly on profile features; sub-5ms CPU latency; fully explainable.
  3. *Cosine Profile Scorer + Constraint Filter (Deterministic Baseline Refinement):* Directly computes weighted profile alignment; instantaneous; easiest to implement and verify.
- **Default Position:** Option 3 (Refined Cosine Profile Scorer) upgraded to Option 2 if dev-set ranking metrics warrant the complexity.
- **Owner:** Ahmed Yousef · **Needed By:** W19 (17 Jan 2027).

---

<a id="od-2"></a>
### OD-2 — Inclusion of leagues and quests in MVP
- **Question:** Should Masar implement competitive cohort leagues (leaderboards) and periodic quests in the initial MVP?
- **Options Considered:**
  1. *Yes:* Maximize competitive engagement.
  2. *No:* De-scope leagues and quests entirely from MVP; focus exclusively on personal mastery mechanics (XP, daily streak, daily goal, spaced review).
- **Default Position:** **Option 2 (No).** Competitive leaderboards introduce social comparison anxiety, encourage rapid guess-and-check cheating over thoughtful study, and require complex weekly reset cron jobs.
- **Owner:** Abdelrahman · **Needed By:** W12 (29 Nov 2026).

---

<a id="od-3"></a>
### OD-3 — Mascot and visual identity design
- **Question:** What is Masar's visual identity, and should the platform feature a mascot character?
- **Options Considered:**
  1. *No Mascot:* Pure utility interface (academic dashboard style).
  2. *Third-Party Asset Pack:* Utilize generic open-source vector illustrations.
  3. *Original Masar Mascot:* Bespoke character designed by Yousef Khaled representing a supportive academic guide, featuring an original color palette (Navy/Teal/Amber) that distinctly avoids mimicking any commercial platform.
- **Default Position:** **Option 3.** An original mascot gives Masar a memorable identity for the graduation project defense and marketing presentations without intellectual property concerns.
- **Owner:** Yousef Khaled · **Needed By:** W14 (13 Dec 2026).

---

<a id="od-4"></a>
### OD-4 — Notification delivery channels
- **Question:** How should daily practice reminders and weekly digest reports be delivered to students?
- **Options Considered:**
  1. *Web Push Notifications (Service Workers):* High browser permission friction; unreliable across iOS Safari.
  2. *Email Notifications Only:* 100% reliable, user-controlled, strictly opt-in, simple to implement via background job.
  3. *In-App Banners Only:* Zero delivery outside the app.
- **Default Position:** **Option 2 (Email Only).** Delivery is strictly opt-in; users select daily study hours; unsubscribe is instantaneous.
- **Owner:** Mazen · **Needed By:** W14 (13 Dec 2026).

---

<a id="od-5"></a>
### OD-5 — Static content bundle hosting provider
- **Question:** Where should pre-compiled static unit JSON bundles (`/content/bundles/*.json`) be deployed?
- **Options Considered:**
  1. *Same Static Host as the SPA (e.g., GitHub Pages or Vercel):* Zero cost, global edge CDN caching, simple CI build and deploy step.
  2. *Cloudflare Pages / Workers:* High performance, generous free tier, requires an extra account.
  3. *Database / S3 Object Storage:* Adds unnecessary cloud moving parts and potential egress charges.
- **Default Position:** **Option 1 (Same Static Host as the SPA).** Bundles are placed in the `dist/content` bundle path of the frontend build, ensuring zero configuration overhead and unified cache invalidation.
- **Owner:** Mohamed Salah · **Needed By:** W11 (22 Nov 2026).

---

<a id="od-6"></a>
### OD-6 — AI backup staffing and Ahmed's scope
- **Question:** Who backs up Ahmed Yousef on FastAPI, MiniLM embeddings, and prompt engineering if he faces capacity constraints, and how is his scope controlled?
- **Options Considered:**
  1. *Assign Ziad as Secondary AI Developer:* Ziad already understands Python and REST APIs; pairs on FastAPI endpoints and Engine D prompt templates.
  2. *Recruit an External Student:* High onboarding friction; unfeasible mid-project.
  3. *Rely Solely on Ahmed:* High single-point-of-failure risk (R-01).
- **Default Position:** **Option 1.** Ziad is formally designated as secondary developer for the AI service. Ahmed focuses exclusively on Engine B ranking, Engine D prompt templates, and evaluation RQ1/RQ3; conversational mentor scope is strictly bounded.
- **Owner:** Abdelrahman · **Needed By:** W10 (15 Nov 2026).

---

<a id="od-7"></a>
### OD-7 — Career track depth contingency threshold
- **Question:** If content authoring velocity lags behind schedule at the W23 milestone, how should the team adjust track depth?
- **Options Considered:**
  1. *Author Shallow Atoms across all 6 Careers:* Reduces depth to Level 1–2 for all roles.
  2. *Focus Full Depth on 3 Core Careers:* Deliver comprehensive, deep curricula (Levels 1–5, 800+ atoms each) for **Backend, Frontend/Full-Stack, and Data Engineering**; provide curated outline units for AI/ML, DevOps, and Cybersecurity.
  3. *Extend Deadlines:* Unacceptable; threatens feature freeze (17 Apr 2027) and university defense.
- **Default Position:** **Option 2 (Focus on 3 Core Careers).** Academic defense panels evaluate pedagogical and technical depth over superficial breadth.
- **Owner:** Osama · **Needed By:** W23 (27 Feb 2027).

---

<a id="od-8"></a>
### OD-8 — Bilingual Arabic atom translations
- **Question:** Should learning atom explanations and exercises be fully translated into Arabic for the MVP?
- **Options Considered:**
  1. *Full Bilingual Curriculum:* Double the authoring and review workload (~8,100 total atoms).
  2. *Arabic-Only:* Excludes industry-standard English software engineering terminology.
  3. *English-First Content with Arabic Platform Shell:* The entire UI shell, navigation, onboarding, and error messaging are fully bilingual (Arabic RTL + English LTR); learning atoms and code exercises remain in technical English (the universal language of Egyptian software hiring).
- **Default Position:** **Option 3.** Egyptian tech hiring and CS coursework operate primarily in English; translating technical syntax and API docs into Arabic introduces terminology confusion and doubles authoring overhead.
- **Owner:** Yousef Khaled · **Needed By:** W18 (23 Jan 2027).

---

<a id="od-9"></a>
### OD-9 — Transactional email service selection
- **Question:** Which zero-cost email service provider should be selected for sending student verification tokens and weekly digest updates?
- **Options Considered:**
  1. *Resend:* 3,000 free emails/month, 100 emails/day; modern REST API, exceptional deliverability.
  2. *Brevo (formerly Sendinblue):* 300 free emails/day; no credit card required.
  3. *Gmail SMTP Relay:* Fragile, easily flagged as spam, rate-limited, requires Google account app passwords.
- **Default Position:** **Option 2 (Brevo) or Option 1 (Resend).** Brevo's 300/day allowance comfortably accommodates active cohort testing without payment.
- **Owner:** Mohamed Salah · **Needed By:** W12 (29 Nov 2026).

---

<a id="od-10"></a>
### OD-10 — Legacy `/api/roadmap` transition handling
- **Question:** How should the deprecated v1 `/api/roadmap` endpoints be handled in the API v2 release?
- **Options Considered:**
  1. *Maintain Parallel Compatibility Layer:* Emulate coarse phases by grouping atoms into synthetic phases on the fly.
  2. *Immediate Hard Removal (HTTP 404):* Breaks any cached clients or stale test scripts without guidance.
  3. *HTTP 410 Gone with Migration Header:* The endpoint returns `410 Gone` with a JSON payload directing clients to `/api/path`.
- **Default Position:** **Option 3.** Clean, RESTful, and makes the architectural transition unambiguous while preventing silent bugs.
- **Owner:** Mohamed Yasser · **Needed By:** W10 (15 Nov 2026).

---

*End of Open Decisions Log.*
