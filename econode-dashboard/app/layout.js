import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "IoT Enabled Smart Home Automation for Enhanced Energy Efficiency | GCTU",
  description:
    "A case study at Ghana Communication Technology University — IoT-enabled smart home automation node for enhanced energy efficiency.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased min-h-screen" style={{ background: "var(--bg)", color: "#e2e8f0" }}>
        {/* Ambient gradient orbs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 h-[50rem] w-[50rem] rounded-full opacity-30"
               style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-1/4 h-[40rem] w-[40rem] rounded-full opacity-20"
               style={{ background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-1/2 left-0 h-[30rem] w-[30rem] rounded-full opacity-15"
               style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>
        {children}
      </body>
    </html>
  );
}
