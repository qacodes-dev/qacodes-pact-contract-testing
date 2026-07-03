/**
 * Order UI — the CONSUMER.
 *
 * A small typed HTTP client for the Orders API. This is the exact code the
 * Order UI would use in production to talk to the provider. In the contract
 * tests it is pointed at the Pact mock server instead of a real Orders API,
 * so the consumer suite stays fast and deterministic and never needs the
 * provider to be running.
 */

/** The shape of an order as the Order UI consumes it. */
export interface Order {
  id: number;
  product: string;
  quantity: number;
  status: 'PLACED' | 'SHIPPED' | 'CANCELLED';
  createdAt: string;
}

/** Thrown when the Orders API responds 404 for a specific order. */
export class OrderNotFoundError extends Error {
  constructor(public readonly id: number) {
    super(`Order ${id} not found`);
    this.name = 'OrderNotFoundError';
  }
}

/** Thrown for any other non-2xx response the client does not model. */
export class OrdersApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'OrdersApiError';
  }
}

export class OrdersClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    // Trim a trailing slash so path concatenation stays predictable.
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /** GET /orders/:id — a single order, or OrderNotFoundError on 404. */
  async getOrder(id: number): Promise<Order> {
    const res = await fetch(`${this.baseUrl}/orders/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      throw new OrderNotFoundError(id);
    }
    if (!res.ok) {
      throw new OrdersApiError(res.status, `Failed to fetch order ${id}`);
    }

    return (await res.json()) as Order;
  }

  /** GET /orders — the full list of orders. */
  async listOrders(): Promise<Order[]> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new OrdersApiError(res.status, 'Failed to list orders');
    }

    return (await res.json()) as Order[];
  }
}
