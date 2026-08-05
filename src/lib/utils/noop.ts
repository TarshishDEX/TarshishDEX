/**
 * No-operation function — typed for use as default callbacks.
 * Prevents unnecessary function allocations in render cycles.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

export const noopAsync = async (): Promise<void> => {};
