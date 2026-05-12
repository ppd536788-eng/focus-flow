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
    const list = Array.from(new Set((questions ?? []).map((q: any) => q.subject)));
    return list;
  }, [questions]);

  const q: any = questions?.[idx];
  const choices: { id: string; text: string }[] = Array.isArray(q?.choices)
    ? q.choices
    : q?.choices && typeof q.choices === "object"
      ? Object.entries(q.choices).map(([id, text]) => ({ id: String(id).toLowerCase(), text: String(text) }))
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
    <div className="max-w-2xl mx-auto space-y-6">
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
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{q.subject}</span>
            {q.topic && <span>· {q.topic}</span>}
            <span className="ml-auto">{idx + 1}/{questions!.length}</span>
          </div>
          <p className="font-display text-xl sm:text-2xl text-balance mb-6">{q.statement}</p>

          <div className="space-y-2">
            {choices.map((c) => {
              const isChosen = chosen === c.id;
              const isCorrect = c.id === correctId;
              const showState = revealed && (isChosen || isCorrect);
              return (
                <button
                  key={c.id}
                  onClick={() => choose(c.id)}
                  disabled={revealed}
                  className={`w-full text-left rounded-xl border p-4 transition-smooth flex items-center gap-3
                    ${showState && isCorrect ? "border-focus bg-focus/10" : ""}
                    ${showState && isChosen && !isCorrect ? "border-destructive bg-destructive/10" : ""}
                    ${!revealed ? "border-border hover:border-accent hover:bg-accent/5" : "border-border"}
                  `}
                >
                  <span className="size-7 rounded-full border border-border grid place-items-center text-xs font-medium">
                    {c.id.toUpperCase()}
                  </span>
                  <span className="flex-1">{c.text}</span>
                  {showState && isCorrect && <Check className="size-4 text-focus" />}
                  {showState && isChosen && !isCorrect && <X className="size-4 text-destructive" />}
                </button>
              );
            })}
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
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