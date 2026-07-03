# Pact Contract Testing — Order UI ⇄ Orders API

[![Pact Contract Testing](https://github.com/qacodes-dev/qacodes-pact-contract-testing/actions/workflows/pact.yml/badge.svg)](https://github.com/qacodes-dev/qacodes-pact-contract-testing/actions/workflows/pact.yml)

A production-style **consumer-driven contract testing** setup with
[Pact](https://pact.io) and TypeScript. It models two independently deployed
services and walks the full contract lifecycle end to end:

- an **Order UI** (the **consumer**) that calls the Orders API, and
- an **Orders API** (the **provider**) that must honour what the consumer expects.

The consumer writes its expectations against a Pact **mock server** and generates
a **contract** (a pact file). That contract is published to a **Pact Broker**.
The provider then **verifies** it can satisfy every published contract by
replaying the recorded interactions against its real implementation. Finally, the
**`can-i-deploy`** gate queries the broker to decide whether a version is safe to
release.

> Sample project for **[qa.codes](https://qa.codes)** —
> <https://qa.codes/practice/project-samples/pact-contract-testing>

---

## Why consumer-driven contracts?

Integration tests that boot both services are slow, flaky, and force lock-step
deploys. Contract testing splits the integration in two:

- The **consumer** describes *only what it actually uses* as a set of
  interactions, and verifies its client code against a fast, local mock. The
  provider is free to add fields without breaking anyone.
- The **provider** replays those exact interactions against its real API, using
  **provider states** to seed the required data, and publishes the results.

The **broker** stores, versions, and tags every contract and verification result,
and `can-i-deploy` turns that history into a safe deployment decision — so two
services can be released independently and still trust their integration.

---

## Prerequisites

- **Node.js 18+** and **npm 9+**
- A **Pact Broker** for the publish/verify/can-i-deploy flow. Two options:
  - **Dockerised broker** — CI stands one up automatically (see [CI](#ci)); locally
    you can run `docker run -p 9292:9292 pactfoundation/pact-broker` against a Postgres.
  - **[PactFlow](https://pactflow.io) free tier** — a hosted broker; set its URL and token.
- You can also run the consumer tests **and** provider verification with **no
  broker at all** — the verifier falls back to the locally generated
  `./pacts/*.json` files.

---

## Install

```bash
git clone https://github.com/qacodes-dev/qacodes-pact-contract-testing.git
cd qacodes-pact-contract-testing
npm install
cp .env.example .env
# edit .env: set PACT_BROKER_BASE_URL and PACT_BROKER_TOKEN to point at your broker
npx pact-broker version          # confirm the Pact CLI is available
npm run test:consumer            # generate the first pact into ./pacts
```

---

## Run commands

| Command | What it does |
| --- | --- |
| `npm run test:consumer` | Runs the consumer Jest suite against the Pact mock server and writes pact files to `./pacts`. |
| `npm run pact:publish` | Uploads the generated pact files to the Pact Broker, tagged with the consumer version and branch. |
| `npm run test:provider` | Fetches contracts from the broker and replays each interaction against the real provider API, publishing verification results back. *(Falls back to local `./pacts` when no broker is configured.)* |
| `npx pact-broker can-i-deploy --pacticipant OrdersApi --version $PROVIDER_VERSION --to-environment production` | Confirms this provider version is verified against every consumer already in the target environment. |
| `npx pact-broker record-deployment --pacticipant OrdersApi --version $PROVIDER_VERSION --environment production` | Records which version now runs in an environment so future `can-i-deploy` checks stay accurate. |

### Quick local end-to-end (no broker)

```bash
npm run test:consumer   # 3 interactions pass → ./pacts/OrderUi-OrdersApi.json written
npm run test:provider   # boots the Express provider and verifies all 3 interactions
```

---

## Environment configuration

Copy `.env.example` to `.env`. `.env` is gitignored — never commit secrets.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `PACT_BROKER_BASE_URL` | yes | `https://your-org.pactflow.io` | Base URL of the Pact Broker where contracts are published and fetched. |
| `PACT_BROKER_TOKEN` | yes | `pactflow-xxxxxxxx` | Read/write API token authenticating publish and verification calls. |
| `CONSUMER_VERSION` | yes | `a1b2c3d` | Version tagged on published pacts — use the git commit SHA. |
| `PROVIDER_VERSION` | yes | `e4f5g6h` | Version recorded for provider verification results — the git commit SHA. |
| `PACT_BRANCH` | no | `main` | Branch attached to pacts and verifications so the broker can reason about branches. |
| `PROVIDER_BASE_URL` | no | `http://localhost:3001` | URL the verifier targets when replaying interactions against the running API. |

---

## Folder structure

```
package.json                                  Scripts for consumer tests, provider verification, and publishing
.env.example                                  Template for broker URL, token, and version variables — copy to .env
consumer/                                     Consumer service source and its contract tests
  src/ordersClient.ts                         The HTTP client under test — the code that calls the Orders API
  pact/setup.ts                               Configures the Pact consumer instance (names, mock port, log level, dir)
  tests/ordersClient.pact.test.ts             Consumer contract test; interactions and matchers vs. the mock server
provider/                                     Provider service source and its verification harness
  src/app.ts                                  The real Orders API (Express) that must satisfy the contracts
  tests/providerStates.ts                     Provider-state handlers that seed data before each interaction
  tests/verify.pact.test.ts                   Provider verification; replays each pact against the running API
pacts/                                        Generated pact (contract) JSON files, one per consumer–provider pair
scripts/publish-pacts.ts                      Publishes pact files to the broker with the correct version and tags
.github/workflows/pact.yml                    CI: consumer test + publish, provider verify, and can-i-deploy gate
```

---

## The interactions

The consumer declares three small, single-purpose interactions, each with a
**provider state** and **flexible matchers** (`like`, `eachLike`, `term`,
`integer`) so the contract asserts shape and type rather than incidental data:

| Provider state | Consumer call | Expected response |
| --- | --- | --- |
| `an order with id 42 exists` | `getOrder(42)` | `200` + a single order object |
| `orders exist` | `listOrders()` | `200` + a non-empty array of orders |
| `no order with id 999 exists` | `getOrder(999)` | `404` |

Each provider state has a matching handler in `provider/tests/providerStates.ts`
that seeds exactly that precondition (and resets between interactions), so
verifications stay isolated.

---

## Reporting — the Pact Broker is the source of truth

- The broker shows every contract, which versions exist, and the verification
  status of each interaction.
- Its **network graph** visualises which consumers depend on which providers.
- Provider verification results (pass/fail per interaction) are published back to
  the broker and attached to the provider version.
- **`can-i-deploy`** prints a compatibility matrix listing each partner and
  whether the pair is verified.
- A failed verification prints the **expected vs. actual** request/response diff
  in the Jest output, so a broken contract is easy to pinpoint.

---

## CI

`.github/workflows/pact.yml` runs on every push to `main` and on pull requests.
It runs the whole lifecycle in a single job so a **dockerised Pact Broker** (a
service container with Postgres, reachable at `http://localhost:9292`) is shared
across all steps — CI is hermetic and needs no external account:

1. **Consumer** — `npm run test:consumer` generates the pact, then
   `npm run pact:publish` uploads it (versioned with `github.sha`, tagged with the branch).
2. **Provider** — `npm run test:provider` verifies the published contract against
   the real API and publishes results back to the broker.
3. **Gate (push to `main` only)** — `can-i-deploy` confirms `OrdersApi@sha` is
   compatible with the consumer already recorded in `production`; a
   `record-deployment` step then logs the release. Pull requests run steps 1–2
   to validate contracts but never record a production deployment.
4. Generated pacts and mock-server logs are uploaded as a build artifact with `if: always()`.

**Using PactFlow instead of the dockerised broker:** set `PACT_BROKER_BASE_URL`
and `PACT_BROKER_TOKEN` as repository secrets and point the publish/verify steps
at them (drop the `postgres`/`pact-broker` service containers). Never commit
secrets — publishing happens from CI only, so the broker reflects verified builds.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the local workflow, how to add or
change an interaction, and what to put in the *Contract impact* section of a PR.

## License

[MIT](./LICENSE) © qa.codes
