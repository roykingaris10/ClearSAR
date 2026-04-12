import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClearSAR — Subject Access Request backlog clearance",
  description:
    "ClearSAR helps Data Protection Officers identify, draft, and clear SAR backlogs directly from Outlook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-canvas text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
