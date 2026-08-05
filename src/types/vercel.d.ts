declare module "@vercel/analytics/next" {
  import type { FC } from "react";
  export const Analytics: FC<{
    mode?: "auto" | "development" | "production";
    debug?: boolean;
    beforeSend?: (data: Record<string, unknown>) => Record<string, unknown> | null;
  }>;
}

declare module "@vercel/speed-insights/next" {
  import type { FC } from "react";
  export const SpeedInsights: FC<{
    dsn?: string;
    sampleRate?: number;
    route?: string | null;
    beforeSend?: (data: Record<string, unknown>) => Record<string, unknown> | null;
  }>;
}
