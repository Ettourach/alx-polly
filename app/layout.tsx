import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/context/auth-context";

export const metadata: Metadata = {
  title: "ALX Polly - Polling Application",
  description: "Create and share polls with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
