import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Burst = { id: number; amount: number; label?: string };
type Ctx = { burst: (amount: number, label?: string) => void };

const XpContext = createContext<Ctx>({ burst: () => {} });

export const useXpBurst = () => useContext(XpContext);

export const XpProvider = ({ children }: { children: React.ReactNode }) => {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const burst = useCallback((amount: number, label?: string) => {
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, amount, label }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1800);
  }, []);

  return (
    <XpContext.Provider value={{ burst }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center pt-24">
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30, scale: 0.7 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -80, scale: 0.9 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              <div className="px-5 py-3 rounded-2xl bg-gradient-warm shadow-glow text-accent-foreground font-display text-2xl flex items-center gap-2">
                <Sparkles className="size-5" />
                +{b.amount} XP
                {b.label && <span className="text-sm font-sans opacity-80 ml-1">{b.label}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </XpContext.Provider>
  );
};