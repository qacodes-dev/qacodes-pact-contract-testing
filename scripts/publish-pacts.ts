/**
 * Publishes the generated pact files in ./pacts to the Pact Broker.
 *
 * Contracts are versioned with CONSUMER_VERSION (use the git commit SHA so a
 * contract is traceable to a build) and tagged with the branch, so the broker
 * can reason about which contract belongs to which line of development.
 *
 * Intended to run from CI, never a developer laptop, so the broker only ever
 * reflects verified builds. Wired to `npm run pact:publish`.
 *
 * This shells out to the `pact-broker publish` CLI (shipped by
 * @pact-foundation/pact-cli) rather than a programmatic API: pact-cli v17
 * removed the in-process publish/Publisher surface, and the CLI is the stable,
 * version-independent interface.
 */
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import 'dotenv/config';

function main(): void {
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

  const args = [
    'publish',
    pactsDir,
    '--broker-base-url',
    pactBroker,
    '--broker-token',
    pactBrokerToken,
    '--consumer-app-version',
    consumerVersion,
  ];
  if (branch) {
    args.push('--branch', branch, '--tag', branch);
  }

  // `pact-broker` is provided on PATH by npm (node_modules/.bin) when run via
  // `npm run pact:publish`. Use the platform-specific shim on Windows.
  const bin = process.platform === 'win32' ? 'pact-broker.cmd' : 'pact-broker';
  const result = spawnSync(bin, args, { stdio: 'inherit', shell: false });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Failed to publish pacts:', err instanceof Error ? err.message : err);
  process.exit(1);
}
