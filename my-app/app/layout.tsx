import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Nexus Three | AI-Powered B2B Finance OS",
  description:
    "Nexus Three unifies MSME and enterprise invoice operations with AI-driven 3-way matching, compliance automation, and real-time payment intelligence.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      // { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
