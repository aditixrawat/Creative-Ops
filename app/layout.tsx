import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Syne } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "@/app/globals.css";

// ── Fonts ─────────────────────────────────────────────────────────
const spaceGrotesk = Space_Grotesk({
  subsets:  ["latin"],
  variable: "--font-body",
  display:  "swap",
  weight:   ["300","400","500","600","700"],
});
const spaceMono = Space_Mono({
  subsets:  ["latin"],
  variable: "--font-mono",
  display:  "swap",
  weight:   ["400","700"],
});
const syne = Syne({
  subsets:  ["latin"],
  variable: "--font-display",
  display:  "swap",
  weight:   ["400","500","600","700","800"],
});

// ── Metadata ──────────────────────────────────────────────────────
export const metadata: Metadata = {
  title:       { default: "Creative Ops", template: "%s — Creative Ops" },
  description: "AI-powered creative operations for strategists who move fast.",
  keywords:    ["creative operations","AI tools","prompt library","campaign tracker"],
  authors:     [{ name: "Creative Ops" }],
  robots:      { index: false, follow: false }, // private app
  icons: {
    icon:  "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title:       "Creative Ops",
    description: "AI-powered creative operations platform",
    type:        "website",
    images:      [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor:    "#0d0f0e",
  colorScheme:   "dark",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1, // prevent zoom on iOS inputs
};

// ─────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg-base text-[var(--text-primary)] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
