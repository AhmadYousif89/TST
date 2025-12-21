import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { Header } from "@/components/header";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Typing Speed Test",
  description: "Test your typing speed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="container">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
