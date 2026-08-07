import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SwRegister } from "@/components/sw-register";
import { AmbientMotion } from "@/components/ambient-motion";
import "./globals.css";

const faruma = localFont({
  src: "../public/fonts/Faruma.woff2",
  variable: "--font-faruma",
  weight: "400 700",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.koveline.com"),
  title: {
    default: "Koveline — How much do you really know?",
    template: "%s — Koveline",
  },
  description:
    "Study resources from the Maldives. Practice 613 real exam-prep questions across Grade 9 and Grade 10 Islam, mark yourself, and review what you missed.",
  keywords: ["Koveline", "Maldives", "study", "flashcards", "Grade 9", "Islam", "Dhivehi"],
  applicationName: "Koveline",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Koveline", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Koveline — How much do you really know?",
    description: "Study resources from the Maldives — Grade 9 and Grade 10 Islam.",
    type: "website",
    siteName: "Koveline",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Koveline" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#190c09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={faruma.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Noto+Sans+Thaana:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <a
          href="#main"
          className="absolute left-3 top-3 z-[100] -translate-y-24 rounded-ctl bg-teal px-4 py-2 font-bold text-accent-ink transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <AmbientMotion />
        <Navbar />
        <div id="main">{children}</div>
        <Footer />
        <SwRegister />
      </body>
    </html>
  );
}
