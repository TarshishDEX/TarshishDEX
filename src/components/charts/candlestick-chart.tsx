"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import type { Candle } from "@/lib/stellar/types";

const THEME = {
  background: "#0b101c",
  text: "#9aa5c1",
  grid: "#1c2540",
  up: "#34d399",
  down: "#fb7185",
};

export function CandlestickChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: THEME.background },
        textColor: THEME.text,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: { borderColor: THEME.grid },
      timeScale: { borderColor: THEME.grid, timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 420,
      crosshair: {
        vertLine: { color: "#3e8dfd", width: 1, style: 3, labelBackgroundColor: "#3e8dfd" },
        horzLine: { color: "#3e8dfd", width: 1, style: 3, labelBackgroundColor: "#3e8dfd" },
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: THEME.up,
      downColor: THEME.down,
      borderVisible: false,
      wickUpColor: THEME.up,
      wickDownColor: THEME.down,
    });

    const candleData: CandlestickData<Time>[] = candles.map((c) => ({
      time: Math.floor(c.timestamp / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    const volumeData: HistogramData<Time>[] = candles.map((c) => ({
      time: Math.floor(c.timestamp / 1000) as Time,
      value: c.volumeCounter,
      color: c.close >= c.open ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)",
    }));
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && chartRef.current) {
        chartRef.current.applyOptions({ width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  return <div ref={containerRef} className="w-full" aria-label="Price candlestick chart" />;
}
