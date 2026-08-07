"use client";

import { useQuery } from "@tanstack/react-query";
import type { LimitOrder, PaginatedOrders } from "@/lib/stellar/limit-order-types";

/**
 * Query limit orders for a specific user.
 * Invokes the Soroban contract get_user_orders() + get_order() per ID.
 */
export function useUserLimitOrders(address: string | null) {
  return useQuery<LimitOrder[]>({
    queryKey: ["limit-orders", address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/orders?user=${address}`);
      if (!res.ok) throw new Error("Failed to fetch limit orders");
      const data = await res.json();
      return (data.orders ?? []) as LimitOrder[];
    },
    enabled: Boolean(address),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/**
 * Query paginated global list of limit orders.
 */
export function usePaginatedLimitOrders(cursor: number | null, limit = 20) {
  return useQuery<PaginatedOrders>({
    queryKey: ["limit-orders-global", cursor, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor !== null) params.set("cursor", String(cursor));
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    staleTime: 10_000,
  });
}
