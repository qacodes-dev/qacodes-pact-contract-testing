<!--
Thanks for contributing! Keep PRs small and focused — ideally one interaction or
one behaviour change at a time, so contract failures stay easy to diagnose.
-->

## What & why

<!-- What does this change do, and why? Link any related issue. -->

Closes #

## Type of change

- [ ] Consumer change (`consumer/` — client code or interactions)
- [ ] Provider change (`provider/` — Orders API or state handlers)
- [ ] Broker / CI workflow (`scripts/`, `.github/workflows/`)
- [ ] Docs only
- [ ] Other:

## Contract impact

<!-- Contract testing lives and dies by this section — fill it in honestly. -->

- [ ] **No contract change** — matchers, interactions, and provider states are unchanged.
- [ ] **Additive provider change** (new field/endpoint the consumer doesn't rely on) — backwards compatible.
- [ ] **Contract change** (new/edited/removed interaction, matcher, or provider state).
  - [ ] Consumer and provider are updated together **or** rolled out in a compatible order.
  - [ ] Every new/edited interaction declares a **provider state** with a matching handler in `provider/tests/providerStates.ts`.
  - [ ] Matchers (`like` / `eachLike` / `term` / `integer`) are used instead of literals wherever the value is incidental.

## Verification

- [ ] `npm run test:consumer` passes and regenerates the pact
- [ ] `npm run test:provider` passes (verifies the pact against the real provider)
- [ ] `npm run typecheck` passes
- [ ] CI is green

## Notes for reviewers

<!-- Anything worth calling out: tradeoffs, follow-ups, things you're unsure about. -->
