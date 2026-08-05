/**
 * Lightweight typed event emitter for in-app pub/sub.
 * No external dependencies.
 */

type Listener<T> = (payload: T) => void;

export class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }

  removeAll(): void {
    this.listeners.clear();
  }
}

/** App-wide event types for cross-component communication. */
export interface AppEvents {
  "wallet:connected": { address: string };
  "wallet:disconnected": void;
  "swap:completed": { inputAmount: string; outputAmount: string; txHash: string };
  "price-alert:triggered": { asset: string; price: number; direction: string };
}

/** Global app event bus — import and use from any component. */
export const appEvents = new TypedEventEmitter<AppEvents>();
