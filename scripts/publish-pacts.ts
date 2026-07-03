/**
 * Publishes the generated pact files in ./pacts to the Pact Broker.
 *
 * Contracts are versioned with CONSUMER_VERSION (use the git commit SHA so a
 * contract is traceable to a build) and tagged with the branch, so the broker
 * can reason about which contract belongs to which line of development.
 *
 * Intended to run from CI, never a developer laptop, so the broker only ever
 * reflects verified builds. Wired to `npm run pact:publish`.
 */
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { Publisher } from '@pact-foundation/pact-cli';

async function main(): Promise<void> {
  const pactBroker = process.env.PACT_BROKER_BASE_URL;
  const pactBrokerToken = process.env.PACT_BROKER_TOKEN;
  const consumerVersion = process.env.CONSUMER_VERSION;
  const branch = process.env.PACT_BRANCH;

  if (!pactBroker || !pactBrokerToken) {
    throw new Error(
      'PACT_BROKER_BASE_URL and PACT_BROKER_TOKEN must be set to publish pacts.'
    );
  }
  if (!consumerVersion) {
    throw new Error(
      'CONSUMER_VERSION must be set (use the git commit SHA) to version the pact.'
    );
  }

  const pactsDir = path.resolve(process.cwd(), 'pacts');
  const hasPacts =
    fs.existsSync(pactsDir) &&
    fs.readdirSync(pactsDir).some((f) => f.endsWith('.json'));
  if (!hasPacts) {
    throw new Error(
      'No pact files in ./pacts — run `npm run test:consumer` first.'
    );
  }

  const result = await new Publisher({
    pactFilesOrDirs: [pactsDir],
    pactBroker,
    pactBrokerToken,
    consumerVersion,
    ...(branch ? { branch, tags: [branch] } : {}),
  }).publish();

  // eslint-disable-next-line no-console
  console.log('Published pacts to the broker:', result);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to publish pacts:', err);
  process.exit(1);
});
