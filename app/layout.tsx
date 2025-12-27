import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PVE 运营中心",
  description: "Web3 节点管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
