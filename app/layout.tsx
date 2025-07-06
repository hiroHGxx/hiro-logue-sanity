import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./design-variables.css";
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { WebsiteStructuredData } from '@/components/StructuredData'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hiro-logue-sanity.vercel.app'),
  title: "Hiro-Logue - 暮らしの解像度を上げるノート",
  description: "テクノロジーと日常の交差点で見つけた、物事をより深く、面白く捉えるためのヒントをお届けします。あなたの暮らしの「解像度を上げる」気づきを、深い考察とともにシェアしています。",
  keywords: ["ブログ", "テクノロジー", "日常", "プログラマー", "家族", "気づき", "洞察"],
  authors: [{ name: "ヒロ", url: "https://hiro-logue-sanity.vercel.app" }],
  creator: "ヒロ",
  publisher: "Hiro-Logue",
  openGraph: {
    title: "Hiro-Logue - 暮らしの解像度を上げるノート",
    description: "テクノロジーと日常の交差点で見つけた、物事をより深く、面白く捉えるためのヒントをお届けします。",
    url: "https://hiro-logue-sanity.vercel.app",
    siteName: "Hiro-Logue",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Hiro-Logue - 暮らしの解像度を上げるノート",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hiro-Logue - 暮らしの解像度を上げるノート",
    description: "テクノロジーと日常の交差点で見つけた、物事をより深く、面白く捉えるためのヒントをお届けします。",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{backgroundColor: 'var(--color-background)'}}
      >
        <WebsiteStructuredData 
          url="https://hiro-logue-sanity.vercel.app"
          name="Hiro-Logue - 暮らしの解像度を上げるノート"
          description="テクノロジーと日常の交差点で見つけた、物事をより深く、面白く捉えるためのヒントをお届けします。"
        />
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
