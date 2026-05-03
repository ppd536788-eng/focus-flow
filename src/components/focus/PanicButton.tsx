import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const KEY = "foco-leve:panic:until";
const DURATION_MS = 5 * 60 * 1000;

export const PanicButton = () => {
  const [until, setUntil] = useState<number | null>(() => {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const t = parseInt(v, 10);
    return t > Date.now() ? t : null;
  });
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    if (!until) return;
    const i = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= until) { setUntil(null); localStorage.removeItem(KEY); }
    }, 500);
    return () => clearInterval(i);
  }, [until]);

  useEffect(() => {
    if (!until) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [until]);

  const trigger = () => {
    const t = Date.now() + DURATION_MS;
    localStorage.setItem(KEY, String(t));
    setUntil(t);
    navigate("/app/foco");
  };

  const remaining = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <>
      <Button onClick={trigger} variant="destructive" className="rounded-full shadow-glow">
        <ShieldAlert className="mr-2 size-4" /> Modo Foco Forçado
      </Button>

      <AnimatePresence>
        {until && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-night/95 backdrop-blur-xl flex flex-col items-center justify-center text-foreground"
          >
            <div className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Modo Foco Forçado</div>
            <div className="font-display text-7xl sm:text-8xl tabular-nums">{mm}:{ss}</div>
            <p className="mt-6 max-w-md text-center text-muted-foreground px-6">
              Respire. Volte ao que importa. A navegação está bloqueada por 5 minutos.
            </p>
            <button
              onClick={() => { localStorage.removeItem(KEY); setUntil(null); }}
              className="mt-10 text-xs text-muted-foreground/60 hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="size-3" /> Cancelar emergência
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
