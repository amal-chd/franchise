import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://thekada.in'),
  title: "The Kada Franchise - Empowering Local Commerce | Join Our Network",
  description: "Start your own profitable hyper-local delivery business with The Kada Franchise. We empower local vendors and deliver happiness across Kerala. Apply now!",
  keywords: ["The Kada", "The Kada Franchise", "Delivery Franchise", "Hyper-local Delivery", "Business Opportunity", "Kerala Startup", "Logistics"],
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
  openGraph: {
    title: "The Kada Franchise - Empowering Local Commerce",
    description: "Join the revolution in hyper-local delivery. Connect local vendors with customers through our world-class technology platform.",
    url: "https://thekada.in",
    siteName: "The Kada Franchise",
    images: [
      {
        url: "/hero-image.png",
        width: 1200,
        height: 630,
        alt: "The Kada Franchise Delivery Partner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Kada Franchise - Join Our Network",
    description: "Start your own profitable hyper-local delivery business with The Kada Franchise.",
    images: ["/hero-image.png"],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import ConditionalLayout from '@/components/ConditionalLayout';
import DisableZoom from '@/components/DisableZoom';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DisableZoom />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
}
