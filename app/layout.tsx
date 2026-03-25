import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Potato Snake",
  description: "A retro Nokia-style snake game where the whole snake is made of potatoes.",
  creator: "Shahriar",
  authors: [{ name: "Shahriar", url: "https://www.linkedin.com/in/shahriarbd10/" }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

