# Contributing

Thanks for your interest in improving this Pact contract-testing sample! This is
a teaching repo for [qa.codes](https://qa.codes/practice/project-samples/pact-contract-testing),
so the bar is **clear, correct, and idiomatic** over clever. Small, focused
changes are much easier to review than large ones.

## Ground rules

- Keep interactions **small** — one request/response scenario each — so a failed
  verification points at exactly one thing.
- Prefer **matchers** (`like`, `eachLike`, `regex`, `integer`) over literal values
  so contracts assert shape and type, not incidental data.
- Every interaction declares a **provider state**, and every provider state has a
  matching handler that seeds *exactly* that precondition and resets between runs.
- The **consumer describes only what it uses.** Don't add fields to an interaction
  the client doesn't actually read.

## Prerequisites

- Node.js 18+ and npm 9+
- No broker is required for local development — the provider verifier falls back
  to the locally generated `./pacts/*.json` files.

```bash
npm install
cp .env.example .env   # only needed if you want to exercise a real broker
```

## Development workflow

1. **Create a branch** off `main`.
2. **Make your change** in `consumer/`, `provider/`, `scripts/`, or the workflow.
3. **Run the suites locally** (see below) until green.
4. **Open a PR** and fill in the template — the *Contract impact* section matters.

### Running the tests

```bash
npm run test:consumer   # runs consumer contract tests, (re)generates ./pacts
npm run test:provider   # boots the Express provider and verifies the pact
npm run typecheck       # tsc --noEmit across consumer, provider, scripts
```

Always run `test:consumer` **before** `test:provider` when you change an
interaction — the provider verifies whatever pact currently sits in `./pacts`.

## Making specific kinds of change

### Add or change a consumer interaction
1. Edit `consumer/tests/ordersClient.pact.test.ts` — add the interaction with a
   provider state and matchers. Update `consumer/src/ordersClient.ts` if the
   client needs a new method.
2. Add/adjust the matching handler in `provider/tests/providerStates.ts`.
3. Implement or update the route in `provider/src/app.ts` so verification passes.
4. Run both suites.

### Change the provider (Orders API)
- **Additive** changes (new field/endpoint) should not break existing pacts —
  the consumer ignores what it doesn't ask for. Verify with `npm run test:provider`.
- **Breaking** changes (renamed/removed field the consumer reads) require a
  coordinated consumer update and a compatible rollout order. Call this out in
  the PR's *Contract impact* section.

### Change the broker workflow or CI
- CI runs the whole lifecycle against a **dockerised broker** — see
  `.github/workflows/pact.yml`. Keep publishing **CI-only**; never publish pacts
  or verification results from a laptop.

## Commit & PR conventions

- Write imperative, present-tense commit subjects (e.g. "Add listOrders pagination
  interaction").
- Keep each PR to one logical change.
- CI must be green before merge. Do not commit secrets or a real `.env`.

## Reporting issues

Open a GitHub issue with what you expected, what happened, and — for a failed
verification — the **expected vs. actual** diff from the Jest output. That diff
pinpoints the broken contract.
