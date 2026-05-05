import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogSession } from "@/hooks/useFocusSessions";
import { useXpBurst } from "@/providers/XpProvider";
import { toast } from "sonner";

const STORAGE_KEY = "foco-leve:pomodoro:v1";
const FOCUS_MIN = 25;
const BREAK_MIN = 5;

type Phase = "focus" | "break";
interface State {
  phase: Phase;
  startedAt: number | null;
  remaining: number;
  running: boolean;
  topic: string;
}

const initial: State = { phase: "focus", startedAt: null, remaining: FOCUS_MIN * 60, running: false, topic: "" };

const load = (): State => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const s = JSON.parse(raw) as State;
    if (s.running && s.startedAt) {
      const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
      const rem = Math.max(0, s.remaining - elapsed);
      return { ...s, remaining: rem, startedAt: rem > 0 ? Date.now() - (s.remaining - rem) * 1000 : null, running: rem > 0 };
    }
    return s;
  } catch { return initial; }
};

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export const PomodoroTimer = ({ topic }: { topic?: string }) => {
  const [state, setState] = useState<State>(() => load());
  const tickRef = useRef<number | null>(null);
  const log = useLogSession();
  const { burst } = useXpBurst();
  const initialDuration = state.phase === "focus" ? FOCUS_MIN * 60 : BREAK_MIN * 60;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    if (!state.running) return;
    tickRef.current = window.setInterval(() => {
      setState((s) => {
        if (!s.running || !s.startedAt) return s;
        const rem = Math.max(0, s.remaining - 1);
        if (rem === 0) {
          if (s.phase === "focus") {
            log.mutate(
              { duration_seconds: FOCUS_MIN * 60, topic_label: s.topic || topic, xp_earned: 25 },
              { onSuccess: () => { burst(25, "Foco completo"); toast.success("Sessão concluída!"); } }
            );
            return { phase: "break", startedAt: null, remaining: BREAK_MIN * 60, running: false, topic: s.topic };
          }
          return { phase: "focus", startedAt: null, remaining: FOCUS_MIN * 60, running: false, topic: s.topic };
        }
        return { ...s, remaining: rem };
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [state.running, state.startedAt, log, topic]);

  const start = () => setState((s) => ({ ...s, running: true, startedAt: Date.now() - (initialDuration - s.remaining) * 1000, topic: s.topic || topic || "" }));
  const pause = () => setState((s) => ({ ...s, running: false, startedAt: null }));
  const reset = () => setState({ phase: "focus", startedAt: null, remaining: FOCUS_MIN * 60, running: false, topic: state.topic });

  const progress = 1 - state.remaining / initialDuration;
  const isFocus = state.phase === "focus";

  return (
    <div className="rounded-3xl bg-card border border-border p-8 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        {isFocus ? <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-focus animate-pulse-glow" /> Foco profundo</span>
                 : <span className="inline-flex items-center gap-2"><Coffee className="size-4" /> Pausa</span>}
      </div>

      <div className="relative mx-auto size-64 sm:size-72">
        <svg viewBox="0 0 100 100" className="rotate-[-90deg] size-full">
          <circle cx="50" cy="50" r="46" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
          <motion.circle
            cx="50" cy="50" r="46" fill="none" strokeWidth="4" strokeLinecap="round"
            stroke={isFocus ? "hsl(var(--focus))" : "hsl(var(--accent))"}
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
            transition={{ ease: "linear", duration: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-6xl tracking-tight tabular-nums">{fmt(state.remaining)}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">{topic || state.topic || "sessão livre"}</div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        {state.running ? (
          <Button size="lg" onClick={pause} variant="secondary"><Pause className="mr-2 size-4" /> Pausar</Button>
        ) : (
          <Button size="lg" onClick={start} className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
            <Play className="mr-2 size-4" /> Iniciar
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={reset}><RotateCcw className="size-4" /></Button>
      </div>
    </div>
  );
};
