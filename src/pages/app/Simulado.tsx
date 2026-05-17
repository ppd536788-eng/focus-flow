import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuestions, useSubmitAttempt } from "@/hooks/useQuestions";
import { useXpBurst } from "@/providers/XpProvider";
import { Timer, Trophy, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Phase = "setup" | "running" | "done";

const SIZES = [5, 10, 20];
const DURATIONS = [5, 10, 20, 30];

export default function Simulado() {
  const { data: allQuestions, isLoading } = useQuestions();
  const submit = useSubmitAttempt();
  const { burst } = useXpBurst();

  const [phase, setPhase] = useState<Phase>("setup");
  const [size, setSize] = useState(10);
  const [minutes, setMinutes] = useState(20);
  const [pool, setPool] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    (allQuestions ?? []).forEach((q: any) => s.add(q.subject));
    return Array.from(s);
  }, [allQuestions]);

  const normalizeChoices = (raw: any): Record<string, string> => {
    if (Array.isArray(raw)) {
      const out: Record<string, string> = {};
      raw.forEach((c: any, i) => {
        const id = String(c?.id ?? String.fromCharCode(65 + i)).toUpperCase();
        out[id] = String(c?.text ?? "");
      });
      return out;
    }
    if (raw && typeof raw === "object") {
      const out: Record<string, string> = {};
      Object.entries(raw).forEach(([k, v]: [string, any]) => {
        out[String(k).toUpperCase()] = String(v?.text ?? v ?? "");
      });
      return out;
    }
    return {};
  };
  const normCorrect = (v: any) => String(v ?? "").toUpperCase();

  const start = () => {
    if (!allQuestions || allQuestions.length === 0) {
      toast.error("Sem questões disponíveis.");
      return;
    }
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, Math.min(size, allQuestions.length));
    setPool(shuffled);
    setAnswers({});
    setIdx(0);
    setSecondsLeft(minutes * 60);
    setPhase("running");
  };

  const finish = async () => {
    setPhase("done");
    let correct = 0;
    for (const q of pool) {
      const chosen = answers[q.id];
      if (!chosen) continue;
      const isCorrect = chosen === normCorrect(q.correct_choice);
      if (isCorrect) correct++;
      try {
        await submit.mutateAsync({ question_id: q.id, chosen, is_correct: isCorrect });
      } catch {}
    }
    if (correct > 0) burst(correct * 10, "Simulado");
    toast.success(`Simulado concluído: ${correct}/${pool.length}`);
  };

  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) { finish(); return; }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const current = pool[idx];

  const choose = (key: string) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: key }));
  };

  const next = () => {
    if (idx < pool.length - 1) setIdx(idx + 1);
    else finish();
  };

  const reset = () => {
    setPhase("setup");
    setPool([]);
    setAnswers({});
    setIdx(0);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Simulado cronometrado</h1>
          <p className="text-muted-foreground mt-2">Treine sob pressão. Escolha quantidade e tempo.</p>
        </div>

        <Card className="p-6 space-y-6 shadow-soft">
          <div className="space-y-3">
            <div className="text-sm font-medium">Quantidade de questões</div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((n) => (
                <Button key={n} variant={size === n ? "default" : "outline"} size="sm" onClick={() => setSize(n)}>
                  {n} questões
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium">Duração</div>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((m) => (
                <Button key={m} variant={minutes === m ? "default" : "outline"} size="sm" onClick={() => setMinutes(m)}>
                  {m} min
                </Button>
              ))}
            </div>
          </div>
          {subjects.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Matérias disponíveis: {subjects.join(" · ")}
            </div>
          )}
          <Button size="lg" className="w-full" onClick={start} disabled={isLoading || !allQuestions?.length}>
            <Timer className="size-4 mr-2" />
            Iniciar simulado
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === "done") {
    const correct = pool.filter((q) => answers[q.id] === normCorrect(q.correct_choice)).length;
    const accuracy = Math.round((correct / pool.length) * 100);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 text-center shadow-glow space-y-4">
          <Trophy className="size-12 mx-auto text-accent" />
          <h1 className="font-display text-4xl">Resultado</h1>
          <div className="text-5xl font-display">{correct} / {pool.length}</div>
          <div className="text-muted-foreground">{accuracy}% de acerto · +{correct * 10} XP</div>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="size-4 mr-2" /> Novo simulado
          </Button>
        </Card>

        <div className="space-y-3">
          <h2 className="font-display text-xl">Revisão</h2>
          {pool.map((q, i) => {
            const chosen = answers[q.id];
            const correctK = normCorrect(q.correct_choice);
            const ok = chosen === correctK;
            const choices = normalizeChoices(q.choices);
            return (
              <Card key={q.id} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  {ok ? <CheckCircle2 className="size-5 text-focus shrink-0 mt-0.5" /> : <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Q{i + 1} · {q.subject}</div>
                    <div className="text-sm">{q.statement}</div>
                    {q.image_url && (
                      <img src={q.image_url} alt="" loading="lazy"
                        className="mt-2 rounded-lg max-h-48 object-contain border border-border" />
                    )}
                    <div className="mt-2 text-xs space-y-1">
                      <div>Sua resposta: <span className="font-medium">{chosen ? `${chosen}) ${choices[chosen] ?? ""}` : "—"}</span></div>
                      {!ok && (
                        <div className="text-focus">Correta: <span className="font-medium">{correctK}) {choices[correctK] ?? ""}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const choices = normalizeChoices(current?.choices);
  const selected = current ? answers[current.id] : undefined;
  const urgent = secondsLeft < 60;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">Questão {idx + 1} de {pool.length}</Badge>
        <motion.div
          animate={urgent ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: urgent ? Infinity : 0 }}
          className={`font-mono text-lg ${urgent ? "text-destructive" : ""}`}
        >
          <Timer className="size-4 inline mr-1" />
          {fmtTime(secondsLeft)}
        </motion.div>
      </div>
      <Progress value={((idx + 1) / pool.length) * 100} />

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-5 sm:p-6 space-y-4 shadow-soft">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{current.subject}</div>
              {current.context && (
                <div className="p-3 rounded-lg bg-secondary/40 border border-border">
                  <p className="text-xs text-muted-foreground italic">{current.context}</p>
                </div>
              )}
              {current.image_url && (
                <div className="rounded-xl overflow-hidden bg-secondary/50 border border-border">
                  <img
                    src={current.image_url}
                    alt="Imagem da questão"
                    loading="lazy"
                    className="w-full max-h-80 object-contain mx-auto"
                  />
                </div>
              )}
              <p className="text-base sm:text-lg leading-relaxed">{current.statement}</p>
              <div className="space-y-2">
                {Object.entries(choices).map(([k, v]) => (
                  <motion.button
                    key={k}
                    onClick={() => choose(k)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-colors flex items-start gap-3 ${
                      selected === k
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 hover:bg-secondary"
                    }`}
                  >
                    <span className={`size-8 sm:size-9 rounded-full border-2 grid place-items-center text-xs font-bold shrink-0
                      ${selected === k ? "border-accent text-accent" : "border-border"}`}>
                      {k}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-relaxed pt-1">{v}</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={reset}>Cancelar</Button>
        <Button onClick={next} disabled={!selected}>
          {idx < pool.length - 1 ? "Próxima" : "Finalizar"}
        </Button>
      </div>
    </div>
  );
}
