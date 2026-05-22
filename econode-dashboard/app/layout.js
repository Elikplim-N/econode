import "./globals.css";
import { Instrument_Serif, Inter } from "next/font/google";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Power-Optimized Automation",
  description: "5V regulated IoT node — climate & lighting control",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased bg-[#0a0a0c] text-zinc-100 min-h-screen">
        {/* Ambient background — subtle warm gradient orbs over deep charcoal */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-amber-500/[0.06] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-sky-500/[0.05] blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
