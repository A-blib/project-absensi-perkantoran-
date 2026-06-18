import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "System Absen Perkantoran",
  description:
    "Sistem absensi perkantoran modern dengan validasi GPS, foto absensi, rekap, dan dashboard analitik.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark")}}catch(error){}',
          }}
        />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
