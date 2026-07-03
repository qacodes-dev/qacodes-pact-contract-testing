/**
 * Configures the Pact consumer instance shared by every consumer contract test.
 *
 * The consumer/provider names here are the identities the Pact Broker uses to
 * link contracts together: the Order UI (`OrderUi`) is the consumer, the Orders
 * API (`OrdersApi`) is the provider. Running the tests against this instance
 * starts a local Pact mock server on MOCK_PORT and writes the generated contract
 * to `./pacts`.
 */
import path from 'path';
import { Pact } from '@pact-foundation/pact';

/** Fixed port for the Pact mock server the consumer client is pointed at. */
export const MOCK_PORT = 8992;

/** Base URL the OrdersClient uses under test — the Pact mock server. */
export const MOCK_BASE_URL = `http://127.0.0.1:${MOCK_PORT}`;

export const CONSUMER_NAME = 'OrderUi';
export const PROVIDER_NAME = 'OrdersApi';

export const provider = new Pact({
  consumer: CONSUMER_NAME,
  provider: PROVIDER_NAME,
  port: MOCK_PORT,
  host: '127.0.0.1',
  // Where the generated pact (contract) files are written.
  dir: path.resolve(process.cwd(), 'pacts'),
  // Mock-server logs — handy when an interaction unexpectedly fails to match.
  log: path.resolve(process.cwd(), 'logs', 'pact-mock.log'),
  logLevel: 'warn',
  // Pact specification v2 — widely supported by brokers and verifiers.
  spec: 2,
});
