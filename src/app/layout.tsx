import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

const SITE_URL = "https://kaigaigumi-football.com";

export const metadata: Metadata = {
  title: {
    default: "海外組サカレポ",
    template: "%s | 海外組サカレポ",
  },
  description:
    "日本人選手の海外での活躍を詳細に追跡。試合結果、スタッツ、現地の評価まで全てをカバー。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "海外組サカレポ",
    description:
      "日本人選手の海外での活躍を詳細に追跡。試合結果、スタッツ、現地の評価まで全てをカバー。",
    url: SITE_URL,
    siteName: "海外組サカレポ",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "海外組サカレポ",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "海外組サカレポ",
    description:
      "日本人選手の海外での活躍を詳細に追跡。試合結果、スタッツ、現地の評価まで全てをカバー。",
    images: ["/ogp.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-HSNE1ETY2L"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HSNE1ETY2L');
            `,
          }}
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2824221352087137"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${notoSansJP.variable} font-sans antialiased bg-[#0a0e1a] text-white min-h-screen`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
