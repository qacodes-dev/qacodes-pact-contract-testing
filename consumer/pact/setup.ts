/**
 * Configures the Pact consumer instance shared by every consumer contract test.
 *
 * The consumer/provider names here are the identities the Pact Broker uses to
 * link contracts together: the Order UI (`OrderUi`) is the consumer, the Orders
 * API (`OrdersApi`) is the provider.
 *
 * This uses the modern Pact v4 DSL (`PactV4`): each interaction is declared and
 * then run via `.executeTest(...)`, which spins up a mock server on a random
 * port for the duration of that one test and, on success, appends the
 * interaction to the generated contract in `./pacts`. There is no shared
 * setup/verify/finalize lifecycle — the builder handles it per interaction — so
 * the client is pointed at `mockServer.url` inside each test rather than at a
 * fixed port.
 */
import path from 'path';
import { PactV4, SpecificationVersion } from '@pact-foundation/pact';

export const CONSUMER_NAME = 'OrderUi';
export const PROVIDER_NAME = 'OrdersApi';

export const provider = new PactV4({
  consumer: CONSUMER_NAME,
  provider: PROVIDER_NAME,
  // Where the generated pact (contract) files are written.
  dir: path.resolve(process.cwd(), 'pacts'),
  // Emit a Pact Specification v4 contract — the current default, verifiable by
  // any modern broker and by the provider Verifier in this repo.
  spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
  logLevel: 'warn',
});
