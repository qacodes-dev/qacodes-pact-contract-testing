/**
 * Provider-state handlers.
 *
 * One handler per provider-state string the consumer declared in its
 * interactions. Before Pact replays an interaction, it invokes the matching
 * handler, which seeds the OrderRepository with exactly the data that state
 * describes. Every handler resets the repository first, so each interaction is
 * verified against a clean, isolated fixture — no cross-contamination between
 * interactions.
 */
import { OrderRepository, Order } from '../src/app';

const FIXTURE_ORDER: Order = {
  id: 42,
  product: 'Mechanical Keyboard',
  quantity: 3,
  status: 'PLACED',
  createdAt: '2026-01-15T10:00:00.000Z',
};

export function buildStateHandlers(
  repo: OrderRepository
): Record<string, () => Promise<void>> {
  return {
    // getOrder(42) → 200 with a single order.
    'an order with id 42 exists': async () => {
      repo.reset();
      repo.save(FIXTURE_ORDER);
    },

    // listOrders() → 200 with a non-empty array.
    'orders exist': async () => {
      repo.reset();
      repo.save(FIXTURE_ORDER);
      repo.save({
        id: 43,
        product: 'USB-C Cable',
        quantity: 1,
        status: 'SHIPPED',
        createdAt: '2026-01-16T09:30:00.000Z',
      });
    },

    // getOrder(999) → 404. The repository is simply left empty of id 999.
    'no order with id 999 exists': async () => {
      repo.reset();
    },
  };
}
