import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ParticleWrapper } from "@/components/ParticleWrapper/ParticleWrapper";
import CartIndicator from "@/components/CartIndicator";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TECHNICIA'25 | India's Biggest Tech Festival",
  description:
    "Join India's premier tech festival celebrating innovation, creativity, and entrepreneurship with competitions, workshops, and networking opportunities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ParticleWrapper>
          <div className="min-h-screen flex flex-col bg-black">
            <Navbar />

            <CartIndicator />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </div>
        </ParticleWrapper>
      </body>
    </html>
  );
}
