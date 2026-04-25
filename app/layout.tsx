import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const siteUrl = "https://apexbyte.blog";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ApexByte — Modern Tech Blog",
    template: "%s | ApexByte",
  },
  description:
    "ApexByte is a modern tech blog covering deep dives into software engineering, artificial intelligence, web development, and the future of technology. Written for developers and curious minds.",
  keywords: ["tech blog", "software engineering", "AI", "web development", "programming", "technology"],
  authors: [{ name: "ApexByte" }],
  creator: "ApexByte",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "ApexByte",
    title: "ApexByte — Modern Tech Blog",
    description:
      "Deep dives into software engineering, AI, web development, and the future of technology.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ApexByte — Modern Tech Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ApexByte — Modern Tech Blog",
    description:
      "Deep dives into software engineering, AI, web development, and the future of technology.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafafa] text-[#1d1d1f]">
        {children}
      </body>
    </html>
  );
}
