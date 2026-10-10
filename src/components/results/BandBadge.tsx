"use client";

import { motion } from "framer-motion";
import { BAND_DISCLAIMER, BAND_INFO, bandStyle, type Band } from "@/config/bands";

export function BandBadge({ band, size = "lg" }: { band: Band; size?: "sm" | "lg" }) {
  const info = BAND_INFO[band];
  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold" style={bandStyle(band)}>
        <span aria-hidden>{info.icon}</span> {band}
      </span>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}
      className="inline-flex flex-col items-center rounded-3xl px-6 py-4 text-center"
      style={bandStyle(band)}
    >
      <span aria-hidden className="text-4xl">
        {info.icon}
      </span>
      <span className="mt-1 font-serif text-3xl font-semibold">{band}</span>
      <span className="text-xs font-medium uppercase tracking-wider">Competitiveness band</span>
    </motion.div>
  );
}

export function Disclaimer({ extra }: { extra?: string }) {
  return (
    <div role="note" className="print-break flex gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm">
      <span aria-hidden>⚖️</span>
      <p>
        {BAND_DISCLAIMER}
        {extra ? ` ${extra}` : ""}
      </p>
    </div>
  );
}
