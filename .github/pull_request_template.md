# Pull Request

## Summary

<!-- Briefly explain what changed and why. Include relevant context. -->

Closes #<!-- issue number -->
Satisfies: `<!-- FR/US/AC reference, e.g. FR-12, US-04 AC2, S0 -->`

---

## Type of Change

- [ ] `feat`: New feature or user-facing functionality
- [ ] `fix`: Bug fix
- [ ] `docs`: Documentation update
- [ ] `refactor`: Code refactoring without functional changes
- [ ] `test`: New or updated tests
- [ ] `chore`: Tooling, dependencies, or CI/CD adjustments

---

## Architectural & Boundary Checks

- [ ] **Dependency Rule:** `Api -> Application -> Domain` and `Application -> Infrastructure -> Domain`.
- [ ] **Domain Purity:** `Masar.Domain` contains NO external dependencies, EF references, or I/O.
- [ ] **API Contract:** Matches [07 — API Contract](../docs/07-api-contract.md). Error envelopes match RFC format.
- [ ] **Privacy Boundary:** No student PII (name, email, ID) is forwarded to third-party/AI endpoints.
- [ ] **Secrets:** Zero credentials, keys, or passwords committed.

---

## Definition of Done Checklist

Every task must satisfy all of these before merging into `main`:

- [ ] **Reviewed PR:** Code approved by at least one reviewer.
- [ ] **Tests:** Unit tests for domain logic; integration tests for endpoints.
- [ ] **Acceptance Criteria:** Every criterion of the linked user story/task passes.
- [ ] **Reachable from UI:** No orphaned backend endpoints or dead links.
- [ ] **Authorization:** Verified that another student's data is provably inaccessible.
- [ ] **Staging Exercise:** Tested on staging environment after deployment.
- [ ] **Docs Updated:** Any behavior change is reflected in `docs/`.
- [ ] **Zero Warnings:** No compiler, linter, or markdownlint warnings.
- [ ] **Accessible:** Keyboard-navigable, labeled, not color-only for meaning (WCAG AA).
- [ ] **States Handled:** Loading, empty, and error states handled gracefully.

---

## How Was This Tested?

<!-- Detail manual testing, automated tests added, or reproduction steps -->
- [ ] Automated tests: `...`
- [ ] Manual test scenario: `...`
