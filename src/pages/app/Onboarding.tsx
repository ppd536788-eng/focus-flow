import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGeneratePlan } from "@/hooks/useStudyPlan";
import { toast } from "sonner";

const Onboarding = () => {
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState(15);
  const [subjectsText, setSubjectsText] = useState("");
  const [weak, setWeak] = useState("");
  const navigate = useNavigate();
  const gen = useGeneratePlan();

  const submit = async () => {
    const subjects = subjectsText.split(",").map((s) => s.trim()).filter(Boolean);
    if (!goal || !subjects.length) { toast.error("Preencha objetivo e ao menos uma matéria."); return; }
    try {
      await gen.mutateAsync({ goal, hoursPerWeek: hours, subjects, weakPoints: weak });
      toast.success("Plano gerado!");
      navigate("/app");
    } catch (e: any) {
      toast.error(e.message === "rate_limited" ? "Limite atingido, tente em instantes." :
                  e.message === "payment_required" ? "Créditos de IA insuficientes." :
                  "Falha ao gerar plano");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex size-12 rounded-2xl bg-gradient-warm shadow-glow items-center justify-center mb-6">
          <Sparkles className="size-5 text-accent-foreground" />
        </div>
        <h1 className="font-display text-4xl mb-2">Vamos montar seu plano</h1>
        <p className="text-muted-foreground mb-8">Algumas perguntas e a IA gera um plano semanal pra você.</p>
      </motion.div>

      <div className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
        <div className="space-y-1.5">
          <Label>Qual é o seu objetivo?</Label>
          <Input placeholder="Ex: Passar no ENEM 2026" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Horas por semana</Label>
          <Input type="number" min={3} max={60} value={hours} onChange={(e) => setHours(parseInt(e.target.value || "0", 10))} />
        </div>
        <div className="space-y-1.5">
          <Label>Matérias (separadas por vírgula)</Label>
          <Input placeholder="Matemática, Português, Redação…" value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Pontos fracos (opcional)</Label>
          <Textarea placeholder="Ex: tenho dificuldade em funções e interpretação de texto" value={weak} onChange={(e) => setWeak(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={gen.isPending} size="lg" className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
          {gen.isPending ? (<><Loader2 className="mr-2 size-4 animate-spin" /> Gerando…</>) : "Gerar meu plano"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;