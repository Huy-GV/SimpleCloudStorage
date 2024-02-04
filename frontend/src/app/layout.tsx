import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppBar from "@/components/appBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simple File Storage",
  description: "Simple Cloud Storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppBar></AppBar>
        {children}
      </body>
    </html>
  );
}
