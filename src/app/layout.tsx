import type { Metadata } from "next";
import { Sora, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  style: ["normal"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
      <body className={`${sora.variable} ${robotoMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
