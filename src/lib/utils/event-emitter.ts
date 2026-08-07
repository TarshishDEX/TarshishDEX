/**
 * Type-safe event emitter for cross-component communication.
 * Lightweight alternative to prop drilling or context for non-React events.
 */

type Listener<T> = (data: T) => void;

class TypedEventEmitter<Events extends Record<string, unknown> & {}
> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  /** Unsubscribe from an event. */
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  /** Emit an event to all listeners. */
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners.clear();
  }
}

/** Application-wide event types. */
export interface AppEvents {
  "wallet:connected": { address: string };
  "wallet:disconnected": void;
  "swap:completed": { txHash: string };
  "price:alert": { asset: string; price: number };
}

/** Global event bus instance. */
export const appEvents = new TypedEventEmitter<AppEvents>();
