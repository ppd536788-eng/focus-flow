import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, RotateCcw, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { useSubmitAttempt } from "@/hooks/useQuestions";
import { useXpBurst } from "@/providers/XpProvider";
import { toast } from "sonner";

type WrongQ = {
  id: string;
  subject: string;
  statement: string;
  choices: Record<string, string>;
  correct_choice: string;
  explanation: string | null;
};

const useWrongQuestions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wrong-questions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: attempts, error } = await supabase
        .from("question_attempts")
        .select("question_id,is_correct,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const wrongIds = new Set<string>();
      const correctedIds = new Set<string>();
      (attempts ?? []).forEach((a) => {
        if (a.is_correct) correctedIds.add(a.question_id);
        else if (!correctedIds.has(a.question_id)) wrongIds.add(a.question_id);
      });
      const ids = Array.from(wrongIds);
      if (ids.length === 0) return [] as WrongQ[];
      const { data: qs, error: e2 } = await supabase
        .from("questions").select("*").in("id", ids);
      if (e2) throw e2;
      return (qs ?? []) as any as WrongQ[];
    },
  });
};

export default function Revisao() {
  const { data: questions, isLoading, refetch } = useWrongQuestions();
  const submit = useSubmitAttempt();
  const { burst } = useXpBurst();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  const pool = useMemo(() => questions ?? [], [questions]);
  const current = pool[idx];

  useEffect(() => { setRevealed(false); setChosen(null); }, [idx]);

  const answer = async (key: string) => {
    if (!current || revealed) return;
    setChosen(key);
    setRevealed(true);
    const isCorrect = key === current.correct_choice;
    try {
      await submit.mutateAsync({ question_id: current.id, chosen: key, is_correct: isCorrect });
      if (isCorrect) burst(10, "Revisão");
    } catch {/* noop */}
  };

  const next = () => {
    if (idx < pool.length - 1) setIdx(idx + 1);
    else { toast.success("Revisão concluída!"); refetch(); setIdx(0); }
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Carregando…</div>;
  }

  if (!pool.length) {
    return (
      <div className="max-w-xl mx-auto pt-10 text-center">
        <div className="inline-flex size-14 rounded-2xl bg-gradient-warm shadow-glow items-center justify-center mb-5">
          <Sparkles className="size-6 text-accent-foreground" />
        </div>
        <h1 className="font-display text-3xl mb-2">Nada a revisar</h1>
        <p className="text-muted-foreground">
          Quando você errar uma questão, ela aparece aqui para revisão espaçada.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Revisão</h1>
          <p className="text-sm text-muted-foreground">Repita os erros até dominar.</p>
        </div>
        <Badge variant="secondary">{idx + 1}/{pool.length}</Badge>
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div key={current.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="p-6 space-y-4 shadow-soft">
              <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Brain className="size-3.5" /> {current.subject}
              </div>
              <p className="text-lg">{current.statement}</p>
              <div className="space-y-2">
                {Object.entries(current.choices).map(([k, v]) => {
                  const isCorrect = k === current.correct_choice;
                  const isChosen = chosen === k;
                  let cls = "border-border hover:border-accent/50 hover:bg-secondary";
                  if (revealed) {
                    if (isCorrect) cls = "border-focus bg-focus/10";
                    else if (isChosen) cls = "border-destructive bg-destructive/10";
                    else cls = "border-border opacity-60";
                  }
                  return (
                    <button key={k} disabled={revealed} onClick={() => answer(k)}
                      className={`w-full text-left p-3 rounded-xl border transition-smooth ${cls}`}>
                      <span className="font-medium mr-2">{k})</span>{v}
                      {revealed && isCorrect && <CheckCircle2 className="size-4 inline ml-2 text-focus" />}
                      {revealed && isChosen && !isCorrect && <XCircle className="size-4 inline ml-2 text-destructive" />}
                    </button>
                  );
                })}
              </div>
              {revealed && current.explanation && (
                <div className="rounded-xl bg-secondary p-4 text-sm">
                  <div className="font-medium mb-1">Explicação</div>
                  <p className="text-muted-foreground">{current.explanation}</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <Button onClick={next} disabled={!revealed}>
          <RotateCcw className="size-4 mr-2" />
          {idx < pool.length - 1 ? "Próxima" : "Concluir"}
        </Button>
      </div>
    </div>
  );
}