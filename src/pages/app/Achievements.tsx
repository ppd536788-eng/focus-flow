import { motion } from "framer-motion";
import { Flame, Star, Trophy } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useRecentSessions } from "@/hooks/useFocusSessions";

const Achievements = () => {
  const { data: profile } = useProfile();
  const { data: sessions } = useRecentSessions(50);
  const totalMin = (sessions ?? []).reduce((s, x) => s + Math.round(x.duration_seconds / 60), 0);
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpInLevel = xp % 200;
  const pct = (xpInLevel / 200) * 100;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl sm:text-4xl">Conquistas</h1>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl bg-gradient-night text-foreground p-8 shadow-soft relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 size-[300px] rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Nível atual</div>
          <div className="font-display text-6xl mb-4">Nv. {level}</div>
          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-warm" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{xpInLevel} / 200 XP até nível {level + 1}</div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card icon={Trophy} label="XP total" value={xp} />
        <Card icon={Flame} label="Sessões" value={sessions?.length ?? 0} />
        <Card icon={Star} label="Minutos" value={totalMin} />
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
      <Icon className="size-3.5" /> {label}
    </div>
    <div className="font-display text-3xl mt-2 tabular-nums">{value}</div>
  </div>
);

export default Achievements;