import { motion } from "framer-motion";
import { Flame, Star, Trophy } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useRecentSessions } from "@/hooks/useFocusSessions";

const Achievements = () => {
  const { data: profile } = useProfile();
  const { data: sessions } = useRecentSessions(120);
  const totalMin = (sessions ?? []).reduce((s, x) => s + Math.round(x.duration_seconds / 60), 0);
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpInLevel = xp % 200;
  const pct = (xpInLevel / 200) * 100;

  // Build last 28 days heatmap
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; minutes: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push({ date: d, minutes: 0 });
  }
  (sessions ?? []).forEach((s) => {
    const d = new Date(s.completed_at); d.setHours(0, 0, 0, 0);
    const slot = days.find((x) => x.date.getTime() === d.getTime());
    if (slot) slot.minutes += Math.round(s.duration_seconds / 60);
  });
  const intensity = (m: number) => {
    if (m === 0) return "bg-muted/40";
    if (m < 25) return "bg-accent/30";
    if (m < 60) return "bg-accent/60";
    if (m < 120) return "bg-accent/80";
    return "bg-accent";
  };

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

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Últimos 28 dias</h3>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            menos
            <span className="size-3 rounded-sm bg-muted/40 ml-1" />
            <span className="size-3 rounded-sm bg-accent/30" />
            <span className="size-3 rounded-sm bg-accent/60" />
            <span className="size-3 rounded-sm bg-accent/80" />
            <span className="size-3 rounded-sm bg-accent mr-1" />
            mais
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015 }}
              title={`${d.date.toLocaleDateString("pt-BR")} — ${d.minutes} min`}
              className={`aspect-square rounded-md ${intensity(d.minutes)}`}
            />
          ))}
        </div>
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