import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
