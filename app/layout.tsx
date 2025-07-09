import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Django Generator YAML Editor",
  description: "YAML Editor for write Django projects in an declarative way",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
