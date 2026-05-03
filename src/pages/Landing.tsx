import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Sparkles, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const Feat = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-soft">
    <div className="size-10 rounded-xl bg-gradient-warm grid place-items-center text-accent-foreground mb-4">
      <Icon className="size-5" />
    </div>
    <h3 className="font-display text-xl mb-1.5">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute top-96 -right-40 size-[500px] rounded-full bg-focus/10 blur-3xl" />

      <header className="relative container flex items-center justify-between py-6">
        <Link to="/" className="font-display text-xl tracking-tight inline-flex items-center gap-2">
          <span className="size-7 rounded-lg bg-gradient-warm grid place-items-center text-accent-foreground">
            <Sparkles className="size-4" />
          </span>
          Foco Leve
        </Link>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
          <Button asChild className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
            <Link to="/auth?mode=signup">Começar grátis</Link>
          </Button>
        </div>
      </header>

      <section className="relative container pt-12 sm:pt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent mb-6">
            <span className="size-1.5 rounded-full bg-accent" /> Inteligência adaptativa para estudos
          </span>
          <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight text-balance">
            Estude com leveza.<br />
            <span className="italic font-medium text-muted-foreground">Performe com</span>{" "}
            <span className="bg-gradient-warm bg-clip-text text-transparent">precisão.</span>
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-xl text-balance">
            Plano de estudos gerado por IA, pomodoro que não zera no refresh, modo de foco forçado e gamificação que vicia.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow group">
              <Link to="/auth?mode=signup">
                Gerar meu plano agora
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost"><Link to="/auth">Já tenho conta</Link></Button>
          </div>
        </motion.div>

        <div className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feat icon={Brain} title="Plano por IA" desc="Onboarding curto. Plano semanal personalizado em segundos." />
          <Feat icon={Timer} title="Pomodoro persistente" desc="Refresh, fechar aba, voltar amanhã — o tempo continua certo." />
          <Feat icon={Sparkles} title="Modo Foco Forçado" desc="Bloqueio de 5 min para vencer o impulso de procrastinar." />
          <Feat icon={Trophy} title="XP e níveis" desc="Cada sessão concluída vira progresso visível e prazeroso." />
        </div>
      </section>
    </div>
  );
};

export default Landing;
