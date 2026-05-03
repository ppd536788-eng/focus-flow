import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useActivePlan } from "@/hooks/useStudyPlan";
import { useAdaptiveEngine } from "@/hooks/useAdaptiveEngine";
import { useRecentSessions } from "@/hooks/useFocusSessions";
import { Button } from "@/components/ui/button";
import { PanicButton } from "@/components/focus/PanicButton";

const Dashboard = () => {
  const { data: profile } = useProfile();
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const eng = useAdaptiveEngine();
  const { data: sessions } = useRecentSessions(5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const today = days[new Date().getDay()];
  const todayBlock = (plan?.data_json as any)?.weekly_blocks?.find((b: any) => b.day === today);
  const nextItem = todayBlock?.items?.[0];

  if (!planLoading && !plan) {
    return (
      <div className="max-w-2xl mx-auto pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex size-16 rounded-2xl bg-gradient-warm shadow-glow items-center justify-center mb-6">
            <Sparkles className="size-7 text-accent-foreground" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl mb-3 text-balance">
            {greeting}{profile?.display_name ? `, ${profile.display_name}` : ""}.
          </h1>
          <p className="text-muted-foreground mb-10 text-balance">
            Você ainda não tem um plano de estudos. Vamos criar um em segundos com IA?
          </p>
          <Button asChild size="lg" className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow text-base h-14 px-8 rounded-2xl">
            <Link to="/app/onboarding">Gerar meu plano agora <ArrowRight className="ml-2 size-5" /></Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
          {profile?.display_name || "Vamos lá"} — sua próxima missão
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="rounded-3xl bg-gradient-night text-foreground p-8 sm:p-10 shadow-soft relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 size-[300px] rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Próxima missão</div>
            {nextItem ? (
              <>
                <h2 className="font-display text-3xl sm:text-4xl mb-2">{nextItem.topic}</h2>
                <p className="text-muted-foreground">{nextItem.subject} · {nextItem.duration_min} min · {nextItem.kind}</p>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl mb-2">Bloco livre</h2>
                <p className="text-muted-foreground">Escolha um tópico e comece um pomodoro de {eng.recommendedBlockMin} min.</p>
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                <Link to="/app/foco">Iniciar foco <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <PanicButton />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Flame} label="Sequência" value={`${eng.streak} dias`} />
        <Stat icon={TrendingUp} label="Hoje" value={`${eng.todayMin} min`} />
        <Stat icon={Sparkles} label="XP total" value={`${eng.xp}`} />
      </div>

      <div>
        <h3 className="font-display text-xl mb-3">Sessões recentes</h3>
        {sessions?.length ? (
          <div className="rounded-2xl border border-border divide-y divide-border bg-card">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium">{s.topic_label || "Sessão livre"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.completed_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {Math.round(s.duration_seconds / 60)} min · +{s.xp_earned} XP
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sua primeira sessão aparece aqui.
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
      <Icon className="size-3.5" /> {label}
    </div>
    <div className="font-display text-3xl mt-2 tabular-nums">{value}</div>
  </div>
);

export default Dashboard;