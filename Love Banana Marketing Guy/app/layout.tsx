import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messenger Pigeon on Steroids — Love Banana PR & Radio Outreach",
  description: "Messenger Pigeon on Steroids: High-velocity music industry PR & radio dispatch engine for Love Banana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="bg-[#24262c] text-[#d6d9e0] min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
