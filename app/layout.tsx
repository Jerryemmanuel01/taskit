import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Taskit | Daily Chore Tracker",
  description: "Log your daily chores, habits, and time spent on each activity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased bg-slate-50 text-slate-800 min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
