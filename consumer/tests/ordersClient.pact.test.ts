/**
 * Consumer contract test (consumer: OrderUi → provider: OrdersApi).
 *
 * Each `it` declares one interaction with the Pact v4 builder: a provider state
 * (the precondition the provider must set up), the request the client makes, and
 * the response shape the client relies on. `.executeTest(...)` then starts a mock
 * server, runs the real client against it, and on success appends the interaction
 * to the generated contract in ./pacts.
 *
 * Response bodies use Pact MATCHERS (`like`, `eachLike`, `regex`, `integer`)
 * rather than literal values, so the contract asserts *shape and type*, not
 * incidental data — the provider can return a different product name or timestamp
 * without breaking the pact.
 */
import { Matchers } from '@pact-foundation/pact';
import { OrdersClient, OrderNotFoundError } from '../src/ordersClient';
import { provider } from '../pact/setup';

const { like, eachLike, regex, integer } = Matchers;

// Matches an ISO-8601 timestamp so the contract survives changing dates.
const iso8601 = regex(
  '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$',
  '2026-01-15T10:00:00.000Z'
);

// Matches only the order statuses the Order UI knows how to render.
const orderStatus = regex('^(PLACED|SHIPPED|CANCELLED)$', 'PLACED');

describe('OrdersClient contract with OrdersApi', () => {
  it('getOrder(42) returns a single order when it exists', async () => {
    await provider
      .addInteraction()
      .given('an order with id 42 exists')
      .uponReceiving('a request for order 42')
      .withRequest('GET', '/orders/42', (builder) => {
        builder.headers({ Accept: 'application/json' });
      })
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        builder.jsonBody({
          id: integer(42),
          product: like('Mechanical Keyboard'),
          quantity: integer(3),
          status: orderStatus,
          createdAt: iso8601,
        });
      })
      .executeTest(async (mockServer) => {
        const client = new OrdersClient(mockServer.url);
        const order = await client.getOrder(42);

        expect(order.id).toBe(42);
        expect(typeof order.product).toBe('string');
        expect(order.quantity).toBe(3);
        expect(['PLACED', 'SHIPPED', 'CANCELLED']).toContain(order.status);
      });
  });

  it('listOrders() returns an array of orders when orders exist', async () => {
    await provider
      .addInteraction()
      .given('orders exist')
      .uponReceiving('a request for all orders')
      .withRequest('GET', '/orders', (builder) => {
        builder.headers({ Accept: 'application/json' });
      })
      .willRespondWith(200, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        // eachLike asserts "an array where every element looks like this",
        // independent of how many orders the provider actually returns.
        builder.jsonBody(
          eachLike({
            id: integer(1),
            product: like('Mechanical Keyboard'),
            quantity: integer(1),
            status: orderStatus,
            createdAt: iso8601,
          })
        );
      })
      .executeTest(async (mockServer) => {
        const client = new OrdersClient(mockServer.url);
        const orders = await client.listOrders();

        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length).toBeGreaterThan(0);
        expect(typeof orders[0].id).toBe('number');
      });
  });

  it('getOrder(999) throws OrderNotFoundError when the order is missing', async () => {
    await provider
      .addInteraction()
      .given('no order with id 999 exists')
      .uponReceiving('a request for order 999')
      .withRequest('GET', '/orders/999', (builder) => {
        builder.headers({ Accept: 'application/json' });
      })
      .willRespondWith(404, (builder) => {
        builder.headers({ 'Content-Type': 'application/json' });
        builder.jsonBody({ error: like('Order not found') });
      })
      .executeTest(async (mockServer) => {
        const client = new OrdersClient(mockServer.url);
        await expect(client.getOrder(999)).rejects.toBeInstanceOf(
          OrderNotFoundError
        );
      });
  });
});
