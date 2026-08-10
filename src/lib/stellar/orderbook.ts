import BigNumber from "bignumber.js";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { fromSdkAsset, toSdkAsset } from "@/lib/stellar/asset";
import type { OrderbookData, OrderbookLevel, StellarAsset } from "@/lib/stellar/types";

/** Horizon orderbook levels expose price + amount; value is derived. */
interface HorizonLevel {
  price: string;
  amount: string;
}

function toLevel(level: HorizonLevel): OrderbookLevel {
  const price = Number(level.price);
  const amount = Number(level.amount);
  return { price, amount, value: price * amount };
}

/** Fetch and normalize the orderbook for a base/counter pair. */
export async function fetchOrderbook(
  selling: StellarAsset,
  buying: StellarAsset,
  limit = 50
): Promise<OrderbookData> {
  const server = getHorizonServer();
  const response = await server
    .orderbook(toSdkAsset(selling), toSdkAsset(buying))
    .limit(limit)
    .call();

  const bids = response.bids.map(toLevel);
  const asks = response.asks.map(toLevel);

  const bestBid = bids.length > 0 ? bids[0]!.price : null;
  const bestAsk = asks.length > 0 ? asks[0]!.price : null;
  const midPrice =
    bestBid !== null && bestAsk !== null
      ? Number(new BigNumber(bestBid.toString()).plus(bestAsk.toString()).dividedBy(2).toString())
      : null;
  const spreadPct =
    bestBid !== null && bestAsk !== null && bestBid > 0
      ? Number(
          new BigNumber(bestAsk.toString())
            .minus(bestBid.toString())
            .dividedBy(bestBid.toString())
            .times(100)
            .toString()
        )
      : null;

  return {
    base: fromSdkAsset(response.base),
    counter: fromSdkAsset(response.counter),
    bids,
    asks,
    bestBid,
    bestAsk,
    midPrice,
    spreadPct,
  };
}
