import type { Metadata } from "next";
import Logo from '@/assets/icons/logo.png'
import "./globals.css";

export const metadata: Metadata = {
  title: "Quest",
  description: "Created for CSci 153 - Web Systems",
  icons: {
    icon: Logo.src,
    shortcut: Logo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
