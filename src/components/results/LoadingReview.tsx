"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LoadingReview({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 2600);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center" role="status" aria-live="polite">
      <div className="relative h-24 w-24" aria-hidden>
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-indigo/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute inset-3 rounded-full border-4 border-transparent border-t-indigo"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute inset-0 grid place-items-center text-3xl">🎓</span>
      </div>
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 font-serif text-xl"
      >
        {messages[i]}
      </motion.p>
      <p className="mt-2 text-sm text-muted">This usually takes 10–40 seconds. Please keep this tab open.</p>
    </div>
  );
}
