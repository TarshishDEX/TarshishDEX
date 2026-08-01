import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QueryProvider } from "@/components/providers/query-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { ToastViewport } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TarshishDEX — Stellar Decentralized Exchange",
    template: "%s · TarshishDEX",
  },
  description:
    "A production-grade decentralized trading interface built exclusively on Stellar's native DEX and Soroban smart contracts. Swap, analyze liquidity, track portfolios, and trade with confidence.",
  applicationName: "TarshishDEX",
  keywords: ["stellar", "dex", "soroban", "defi", "trading", "crypto", "blockchain"],
  openGraph: {
    title: "TarshishDEX — Stellar Decentralized Exchange",
    description: "Swap, analyze, and trade Stellar assets through Stellar's native DEX.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06090f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <QueryProvider>
          <WalletProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ToastViewport />
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
