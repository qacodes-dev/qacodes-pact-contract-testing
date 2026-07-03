/**
 * Orders API — the PROVIDER.
 *
 * A small real Express app that must satisfy every published contract. It reads
 * from an in-memory OrderRepository; the provider-state handlers (see
 * provider/tests/providerStates.ts) seed that same repository before each
 * interaction is replayed, so the API returns data appropriate to the state the
 * consumer declared.
 */
import express, { Express } from 'express';

export interface Order {
  id: number;
  product: string;
  quantity: number;
  status: 'PLACED' | 'SHIPPED' | 'CANCELLED';
  createdAt: string;
}

/**
 * In-memory store of orders. Kept deliberately tiny and mutable so that the
 * verification harness can seed exactly the data each provider state describes
 * and reset between interactions.
 */
export class OrderRepository {
  private orders = new Map<number, Order>();

  reset(): void {
    this.orders.clear();
  }

  save(order: Order): void {
    this.orders.set(order.id, order);
  }

  findById(id: number): Order | undefined {
    return this.orders.get(id);
  }

  findAll(): Order[] {
    return [...this.orders.values()];
  }
}

/** Build the Express app backed by the given repository. */
export function createApp(repo: OrderRepository): Express {
  const app = express();
  app.use(express.json());

  // GET /orders — list every order.
  app.get('/orders', (_req, res) => {
    res.status(200).json(repo.findAll());
  });

  // GET /orders/:id — a single order, or 404 if it does not exist.
  app.get('/orders/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }

    const order = repo.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(order);
  });

  return app;
}

// Allow running the provider standalone: `ts-node provider/src/app.ts`.
if (require.main === module) {
  const repo = new OrderRepository();
  repo.save({
    id: 42,
    product: 'Mechanical Keyboard',
    quantity: 3,
    status: 'PLACED',
    createdAt: '2026-01-15T10:00:00.000Z',
  });

  const port = Number(process.env.PORT) || 3001;
  createApp(repo).listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Orders API listening on http://127.0.0.1:${port}`);
  });
}
