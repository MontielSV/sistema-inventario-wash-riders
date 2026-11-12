import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationProvider } from "./components/NotificationProvider";
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
  title: "Wash Riders - Sistema de Inventarios",
  description: "Gestión de productos, existencias y movimientos de inventario.",
  icons: {
    icon: "/wash-riders-192.png",
    shortcut: "/wash-riders-192.png",
    apple: "/wash-riders-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
