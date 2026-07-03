/**
 * Provider verification (provider: OrdersApi).
 *
 * Starts the real Orders API, then runs the Pact Verifier, which replays every
 * recorded interaction against the running app. For each interaction it first
 * invokes the matching provider-state handler to seed data, then issues the
 * recorded request and checks the real response against the contract.
 *
 * Source of pacts:
 *   - If PACT_BROKER_BASE_URL + PACT_BROKER_TOKEN are set, contracts are fetched
 *     from the broker (the production path) and results are published back.
 *   - Otherwise it falls back to the locally generated ./pacts/*.json files, so
 *     you can verify end-to-end on a laptop without a broker while wiring up.
 */
import path from 'path';
import fs from 'fs';
import http from 'http';
import 'dotenv/config';
import { Verifier, VerifierOptions } from '@pact-foundation/pact';
import { createApp, OrderRepository } from '../src/app';
import { buildStateHandlers } from './providerStates';

const PORT = Number(process.env.PROVIDER_PORT) || 3001;
const PROVIDER_BASE_URL =
  process.env.PROVIDER_BASE_URL || `http://127.0.0.1:${PORT}`;

const PACTS_DIR = path.resolve(process.cwd(), 'pacts');

const useBroker = Boolean(
  process.env.PACT_BROKER_BASE_URL && process.env.PACT_BROKER_TOKEN
);

function localPactFiles(): string[] {
  if (!fs.existsSync(PACTS_DIR)) return [];
  return fs
    .readdirSync(PACTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(PACTS_DIR, f));
}

describe('Pact Verification: OrdersApi honours its consumer contracts', () => {
  let server: http.Server;
  const repo = new OrderRepository();

  beforeAll((done) => {
    server = createApp(repo).listen(PORT, done);
  });

  afterAll((done) => {
    server.close(() => done());
  });

  it('validates the expectations of every consumer', async () => {
    const base: VerifierOptions = {
      provider: 'OrdersApi',
      providerBaseUrl: PROVIDER_BASE_URL,
      // One handler per provider state the consumer declared.
      stateHandlers: buildStateHandlers(repo),
      logLevel: 'warn',
    };

    const brokerOptions: Partial<VerifierOptions> = useBroker
      ? {
          pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
          pactBrokerToken: process.env.PACT_BROKER_TOKEN,
          // Version + branch tie this verification result to a provider build.
          providerVersion: process.env.PROVIDER_VERSION || 'dev',
          providerVersionBranch: process.env.PACT_BRANCH,
          // Publish results back to the broker only from CI.
          publishVerificationResult: process.env.CI === 'true',
          // Verify the contract published for the branch this build is running.
          // On CI, PACT_BRANCH is the branch we just published the pact under,
          // so this matches deterministically for both push and PR builds
          // (a `mainBranch: true` selector only resolves on the main branch).
          consumerVersionSelectors: [
            process.env.PACT_BRANCH
              ? { branch: process.env.PACT_BRANCH }
              : { mainBranch: true },
          ],
        }
      : {
          pactUrls: localPactFiles(),
        };

    if (!useBroker && brokerOptions.pactUrls?.length === 0) {
      throw new Error(
        'No pacts to verify: set PACT_BROKER_BASE_URL/PACT_BROKER_TOKEN, ' +
          'or run `npm run test:consumer` first to generate ./pacts/*.json'
      );
    }

    const output = await new Verifier({ ...base, ...brokerOptions }).verifyProvider();
    // eslint-disable-next-line no-console
    console.log('Pact verification complete:\n', output);
  }, 60_000);
});
