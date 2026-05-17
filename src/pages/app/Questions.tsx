import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Check, ChevronRight, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuestions, useSubmitAttempt, useExplainError } from "@/hooks/useQuestions";
import { useXpBurst } from "@/providers/XpProvider";
import { toast } from "sonner";

const Questions = () => {
  const [subject, setSubject] = useState<string | undefined>();
  const { data: questions, isLoading } = useQuestions(subject);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const submit = useSubmitAttempt();
  const explain = useExplainError();
  const { burst } = useXpBurst();
  const [aiText, setAiText] = useState<string | null>(null);

  const subjects = useMemo(() => {
    return Array.from(new Set((questions ?? []).map((q: any) => q.subject)));
  }, [questions]);

  const q: any = questions?.[idx];
  const choices: { id: string; text: string }[] = Array.isArray(q?.choices)
    ? q.choices.map((c: any, i: number) => ({
        id: String(c?.id ?? String.fromCharCode(97 + i)).toLowerCase(),
        text: String(c?.text ?? c ?? ""),
      }))
    : q?.choices && typeof q.choices === "object"
      ? Object.entries(q.choices).map(([id, val]: [string, any]) => ({
          id: String(id).toLowerCase(),
          text: String(val?.text ?? val ?? ""),
        }))
      : [];
  const correctId = String(q?.correct_choice ?? "").toLowerCase();

  const choose = async (cid: string) => {
    if (revealed || !q) return;
    setChosen(cid);
    setRevealed(true);
    const correct = cid === correctId;
    submit.mutate({ question_id: q.id, chosen: cid, is_correct: correct }, {
      onSuccess: () => { if (correct) { burst(10, "Acertou!"); toast.success("Resposta correta!"); } },
    });
    if (!correct) {
      setAiText(null);
      explain.mutate({
        question: q.statement,
        userAnswer: choices.find((c) => c.id === cid)?.text ?? cid,
        correctAnswer: choices.find((c) => c.id === correctId)?.text ?? correctId,
        subject: q.subject,
      }, {
        onSuccess: (d) => setAiText(d.explanation),
        onError: () => setAiText(q.explanation || "Revise o conceito e tente novamente."),
      });
    }
  };

  const next = () => {
    setChosen(null); setRevealed(false); setAiText(null);
    setIdx((i) => Math.min((questions?.length ?? 1) - 1, i + 1));
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!q) return <div className="text-muted-foreground">Sem questões disponíveis.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Banco de questões</h1>
        <p className="text-sm text-muted-foreground mt-1">Resolva, erre, aprenda — a IA explica seus erros.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip label="Todas" active={!subject} onClick={() => { setSubject(undefined); setIdx(0); }} />
        {subjects.map((s) => (
          <Chip key={s} label={s} active={subject === s} onClick={() => { setSubject(s); setIdx(0); }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-soft"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-5 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium uppercase tracking-wider">
                {q.subject}
              </span>
              {q.topic && <span className="text-xs text-muted-foreground">· {q.topic}</span>}
              {q.difficulty && <span className="text-xs text-muted-foreground">· {q.difficulty}</span>}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {idx + 1} de {questions!.length}
            </span>
          </div>

          {q.context && (
            <div className="mb-5 p-4 rounded-xl bg-secondary/40 border border-border">
              <p className="text-sm text-muted-foreground italic leading-relaxed">{q.context}</p>
            </div>
          )}

          {q.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-5 rounded-2xl overflow-hidden bg-secondary/50 border border-border"
            >
              <img
                src={q.image_url}
                alt="Imagem da questão"
                className="w-full h-auto max-h-96 object-contain mx-auto"
                loading="lazy"
              />
            </motion.div>
          )}

          <p className="font-display text-lg sm:text-2xl text-balance mb-6 leading-relaxed">{q.statement}</p>

          <div className="space-y-2.5">
            {choices.map((c, i) => {
              const isChosen = chosen === c.id;
              const isCorrect = c.id === correctId;
              const showState = revealed && (isChosen || isCorrect);
              return (
                <motion.button
                  key={c.id}
                  onClick={() => choose(c.id)}
                  disabled={revealed}
                  whileHover={!revealed ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!revealed ? { scale: 0.99 } : {}}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-colors flex items-start gap-3 sm:gap-4
                    ${showState && isCorrect ? "border-focus bg-focus/10" : ""}
                    ${showState && isChosen && !isCorrect ? "border-destructive bg-destructive/10" : ""}
                    ${!revealed ? "border-border hover:border-accent hover:bg-accent/5" : "border-border"}
                  `}
                >
                  <span className={`size-9 sm:size-10 rounded-full border-2 grid place-items-center text-sm font-bold shrink-0
                    ${showState && isCorrect ? "border-focus text-focus" : ""}
                    ${showState && isChosen && !isCorrect ? "border-destructive text-destructive" : "border-border"}
                  `}>
                    {c.id.toUpperCase()}
                  </span>
                  <span className="flex-1 text-sm sm:text-base leading-relaxed pt-1">{c.text}</span>
                  {showState && isCorrect && <Check className="size-5 text-focus shrink-0 mt-1" />}
                  {showState && isChosen && !isCorrect && <X className="size-5 text-destructive shrink-0 mt-1" />}
                </motion.button>
              );
            })}
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mt-6 rounded-2xl bg-gradient-surface border border-border p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-2">
                <Sparkles className="size-3.5" /> Explicação
              </div>
              {chosen === correctId ? (
                <p className="text-sm">{q.explanation || "Resposta correta!"}</p>
              ) : explain.isPending && !aiText ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Analisando seu erro com IA…
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{aiText || q.explanation || ""}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}

          {revealed && (
            <div className="mt-6 flex justify-end">
              <Button onClick={next} disabled={idx >= (questions!.length - 1)}
                className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                Próxima <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-secondary/30 border border-border">
        <div className="text-xs text-muted-foreground shrink-0">
          Progresso: <span className="font-semibold text-foreground">{idx + 1}/{questions!.length}</span>
        </div>
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${((idx + 1) / questions!.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-gradient-warm rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth border
      ${active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>
    {label}
  </button>
);

export default Questions;
