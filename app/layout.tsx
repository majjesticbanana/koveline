import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SwRegister } from "@/components/sw-register";
import { AmbientMotion } from "@/components/ambient-motion";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import siteCopy from "@/content/site-copy.json";
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
    default: siteCopy.metadata.siteTitle,
    template: `%s — ${siteCopy.brand.name}`,
  },
  description: siteCopy.metadata.description,
  keywords: ["Koveline", "Maldives", "study", "flashcards", "Grade 9", "Islam", "Dhivehi"],
  applicationName: siteCopy.brand.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: siteCopy.brand.name, statusBarStyle: "black-translucent" },
  openGraph: {
    title: siteCopy.metadata.siteTitle,
    description: siteCopy.metadata.openGraphDescription,
    type: "website",
    siteName: siteCopy.brand.name,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteCopy.brand.name }],
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
          {siteCopy.system.skipToContent}
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=JSON.parse(localStorage.getItem('koveline:v3:settings')||'{}');var d=document.documentElement;d.dataset.theme=s.theme||'mahogany';d.dataset.perf=s.performance?'on':'off';d.dataset.motion=s.performance?'off':(s.motion||'full');if(s.thaanaScale)d.style.setProperty('--thaana-scale',s.thaanaScale/100);}catch(e){}",
          }}
        />
        <AmbientMotion />
        <Navbar />
        <div id="main">{children}</div>
        <Footer />
        <SwRegister />
        <Analytics />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="3a278324-ffa5-4a33-8f2b-44d2edac0ba1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
