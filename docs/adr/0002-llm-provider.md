# ADR-0002 — Provider-abstracted free-tier LLM

**Status:** Accepted · **Date:** 2026-09-20 · **Deciders:** Abdelrahman, Ziad, Ahmed Yousef

---

## Context

The AI Mentor ([§06 Engine C](../06-ai-engines.md#4-engine-c--context-aware-ai-mentor-rag)) needs a
language model. The budget is **$0 for everything**, not just for AI
([C1](../02-requirements.md#6-constraints)).

Two properties of the situation shape the decision:

1. **Free tiers change.** Quotas, model names and availability all move on a timescale shorter than a
   35-week project. Binding the codebase to one provider's SDK is a scheduled outage.
2. **Only one feature needs an LLM.** Embeddings run locally
   ([§06 5](../06-ai-engines.md#5-cost-and-quota-budget)), so the mentor is the entire exposure.

## Options considered

### A — Free-tier hosted API behind our own interface *(chosen)*

Several providers offer a usable free tier for a low-volume application. Rather than picking one and
coupling to it, define a narrow internal interface and implement adapters.

### B — Self-hosted small model

Rejected. A model small enough for a free CPU tier (1–3 B parameters) produces answers weak enough to
make the mentor a liability rather than a feature, and free CPU hosting cannot serve it at acceptable
latency. This would consume weeks of Ahmed's time for a should-have feature.

### C — No LLM; templates only

The **fallback**, already fully specified in
[§06 4.6](../06-ai-engines.md#46-fallback--templated-explanations). Not the primary choice, because
grounded natural-language explanation is genuinely useful and is a legitimate part of objective O7.

### D — Paid API

Rejected. Violates C1 with no negotiation.

## Decision

**A free-tier hosted LLM API, accessed exclusively through a provider-agnostic interface, with a
templated fallback that is always available.**

```python
class LlmProvider(Protocol):
    def complete(self, system: str, user: str, max_tokens: int) -> LlmResult: ...

# Implementations: GeminiProvider, GroqProvider, ..., MockProvider, TemplateProvider
```

Rules:

1. **No provider SDK type crosses the interface.** Provider objects never appear outside the adapter.
2. The provider is selected by configuration (`MASAR_LLM_PROVIDER`), never by code branching at a call site.
3. `MockProvider` is the default in local development, so nobody needs a key to run the app.
4. `TemplateProvider` is the automatic fallback on any error, timeout, or quota exhaustion.
5. Prompts live in one module, are provider-neutral, and are version-controlled.

### Provider selection at implementation time (Slice 7, W22)

Selection criteria, in order:

1. A free tier with **no credit card required**.
2. A daily request allowance comfortably above the 200/day system cap in [NFR-09](../02-requirements.md#nfr-09--abuse-and-cost-control).
3. An OpenAI-compatible or simple REST interface, so the adapter stays small.
4. Terms that permit this use, and that do not claim ownership of submitted content.
5. Acceptable latency from Egypt.

**Google Gemini's free tier is the current leading candidate** — it offers per-model RPM/TPM/RPD
allowances without requiring billing to be enabled, and moving to a paid tier is an explicit opt-in
rather than something that can happen accidentally. Groq's free tier is the intended second adapter.
**Verify both against current published limits in W20**, since these numbers change.

## Consequences

**Positive**

- Switching providers is one adapter plus one configuration value — hours, not days.
- No cost, ever, and no possibility of an accidental bill because billing is never enabled.
- Local development needs no API key at all.
- The mentor never hard-fails; the worst case is templated answers.

**Negative**

- The abstraction costs a small amount of extra code (one protocol, two adapters).
- Free tiers are rate-limited, which is why the system-wide cap sits deliberately below the provider's.
- Model quality varies between providers, so mentor answer quality is not perfectly reproducible for the report. Record the model name and version alongside every evaluated answer.

**Neutral**

- Two adapters must be maintained instead of one. That is the price of not being stranded.

## Privacy constraint — non-negotiable

Regardless of provider, the prompt carries **only** the allow-listed context DTO from
[§06 4.4](../06-ai-engines.md#44-privacy-in-the-mentor-prompt): skill names, levels, career names and
computed numbers. Never a name, email, student ID, or free text the student wrote about themselves.
This is enforced by the DTO's shape, not by review discipline.

## Verification

- [ ] **W20** — confirm free-tier limits for two candidate providers against current documentation (Ziad)
- [ ] **W22** — two adapters implemented and switchable by configuration alone
- [ ] **W22** — `TemplateProvider` covers every question intent
- [ ] **W22** — test asserts the context DTO contains no identifier fields
- [ ] **W23** — [RQ4](../09-evaluation.md#rq4--is-the-mentor-grounded) audit run against the selected provider
