"use client";

import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function GlassCard({ children, className = "", hoverEffect = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl p-6 shadow-lg shadow-slate-100/50 ${
        hoverEffect ? "hover:border-violet-500/20 hover:bg-white/95 hover:shadow-xl hover:shadow-slate-200/60" : ""
      } transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
