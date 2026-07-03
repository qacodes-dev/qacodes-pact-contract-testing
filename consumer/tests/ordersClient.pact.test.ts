/**
 * Consumer contract test (consumer: OrderUi → provider: OrdersApi).
 *
 * Each `it` declares one interaction against the Pact mock server: a provider
 * state (the precondition the provider must set up), the request the client
 * makes, and the response shape the client relies on. Response bodies use Pact
 * MATCHERS (`like`, `eachLike`, `term`, `integer`) rather than literal values,
 * so the contract asserts *shape and type*, not incidental data — the provider
 * can return a different product name or timestamp without breaking the pact.
 *
 * Running this suite starts the mock server and, on success, writes the pact
 * file to ./pacts.
 */
import { Matchers } from '@pact-foundation/pact';
import { OrdersClient, OrderNotFoundError } from '../src/ordersClient';
import { provider, MOCK_BASE_URL } from '../pact/setup';

const { like, eachLike, term, integer } = Matchers;

// Matches an ISO-8601 timestamp so the contract survives changing dates.
const iso8601 = term({
  generate: '2026-01-15T10:00:00.000Z',
  matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$',
});

// Matches only the order statuses the Order UI knows how to render.
const orderStatus = term({
  generate: 'PLACED',
  matcher: '^(PLACED|SHIPPED|CANCELLED)$',
});

describe('OrdersClient contract with OrdersApi', () => {
  const client = new OrdersClient(MOCK_BASE_URL);

  beforeAll(() => provider.setup());
  // After every test, assert the client actually made the expected request.
  afterEach(() => provider.verify());
  // After the suite, write the pact file and shut the mock server down.
  afterAll(() => provider.finalize());

  it('getOrder(42) returns a single order when it exists', async () => {
    await provider.addInteraction({
      state: 'an order with id 42 exists',
      uponReceiving: 'a request for order 42',
      withRequest: {
        method: 'GET',
        path: '/orders/42',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: integer(42),
          product: like('Mechanical Keyboard'),
          quantity: integer(3),
          status: orderStatus,
          createdAt: iso8601,
        },
      },
    });

    const order = await client.getOrder(42);

    expect(order.id).toBe(42);
    expect(typeof order.product).toBe('string');
    expect(order.quantity).toBe(3);
    expect(['PLACED', 'SHIPPED', 'CANCELLED']).toContain(order.status);
  });

  it('listOrders() returns an array of orders when orders exist', async () => {
    await provider.addInteraction({
      state: 'orders exist',
      uponReceiving: 'a request for all orders',
      withRequest: {
        method: 'GET',
        path: '/orders',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        // eachLike asserts "an array where every element looks like this",
        // independent of how many orders the provider actually returns.
        body: eachLike({
          id: integer(1),
          product: like('Mechanical Keyboard'),
          quantity: integer(1),
          status: orderStatus,
          createdAt: iso8601,
        }),
      },
    });

    const orders = await client.listOrders();

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(typeof orders[0].id).toBe('number');
  });

  it('getOrder(999) throws OrderNotFoundError when the order is missing', async () => {
    await provider.addInteraction({
      state: 'no order with id 999 exists',
      uponReceiving: 'a request for order 999',
      withRequest: {
        method: 'GET',
        path: '/orders/999',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: like('Order not found') },
      },
    });

    await expect(client.getOrder(999)).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});
