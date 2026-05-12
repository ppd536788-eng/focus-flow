import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

const PALETTE = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--focus))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const Stats = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(new Date(), 14).toISOString();
      const [sessionsRes, attemptsRes] = await Promise.all([
        supabase.from("focus_sessions").select("*").eq("user_id", user!.id).gte("completed_at", since),
        supabase.from("question_attempts").select("*, questions(subject)").eq("user_id", user!.id).gte("created_at", since),
      ]);
      return {
        sessions: sessionsRes.data ?? [],
        attempts: (attemptsRes.data ?? []) as any[],
      };
    },
  });

  const daily = useMemo(() => {
    const days: { date: string; label: string; min: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({ date: format(d, "yyyy-MM-dd"), label: format(d, "dd/MM", { locale: ptBR }), min: 0 });
    }
    (data?.sessions ?? []).forEach((s: any) => {
      const k = format(new Date(s.completed_at), "yyyy-MM-dd");
      const row = days.find((r) => r.date === k);
      if (row) row.min += Math.round(s.duration_seconds / 60);
    });
    return days;
  }, [data]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { subject: string; correct: number; total: number }>();
    (data?.attempts ?? []).forEach((a: any) => {
      const subj = a.questions?.subject ?? "Outros";
      const cur = map.get(subj) ?? { subject: subj, correct: 0, total: 0 };
      cur.total += 1;
      if (a.is_correct) cur.correct += 1;
      map.set(subj, cur);
    });
    return Array.from(map.values()).map((r) => ({ ...r, accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0 }));
  }, [data]);

  const totals = useMemo(() => {
    const totalMin = daily.reduce((a, b) => a + b.min, 0);
    const total = data?.attempts.length ?? 0;
    const correct = (data?.attempts ?? []).filter((a: any) => a.is_correct).length;
    return {
      totalMin,
      sessions: data?.sessions.length ?? 0,
      attempts: total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [daily, data]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">Estatísticas</h1>
        <p className="text-sm text-muted-foreground mt-1">Seus últimos 14 dias de estudo.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Clock} label="Tempo focado" value={`${totals.totalMin} min`} />
        <Kpi icon={Activity} label="Sessões" value={`${totals.sessions}`} />
        <Kpi icon={Target} label="Questões" value={`${totals.attempts}`} />
        <Kpi icon={CheckCircle2} label="Acerto" value={`${totals.accuracy}%`} />
      </div>

      <Card title="Minutos focados por dia">
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  cursor={{ fill: "hsl(var(--accent) / 0.1)" }}
                />
                <Bar dataKey="min" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Acerto por matéria">
          {bySubject.length === 0 ? (
            <Empty msg="Resolva questões para ver." />
          ) : (
            <div className="space-y-3">
              {bySubject.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground tabular-nums">{s.correct}/{s.total} · {s.accuracy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-warm transition-all" style={{ width: `${s.accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Distribuição de questões">
          {bySubject.length === 0 ? (
            <Empty msg="Sem dados ainda." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bySubject} dataKey="total" nameKey="subject" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {bySubject.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
    <h3 className="font-display text-lg mb-4">{title}</h3>
    {children}
  </div>
);

const Kpi = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
      <Icon className="size-3.5" /> {label}
    </div>
    <div className="font-display text-3xl mt-2 tabular-nums">{value}</div>
  </div>
);

const Skeleton = () => <div className="h-64 rounded-xl bg-secondary/50 animate-pulse" />;
const Empty = ({ msg }: { msg: string }) => (
  <div className="h-40 grid place-items-center text-sm text-muted-foreground">{msg}</div>
);

export default Stats;