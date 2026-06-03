import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MagicBell Notifications",
  description: "MagicBell notifications with custom tabs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
