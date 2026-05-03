import { useActivePlan } from "@/hooks/useStudyPlan";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

const Schedule = () => {
  const { data: plan, isLoading } = useActivePlan();
  const blocks = (plan?.data_json as any)?.weekly_blocks ?? [];

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!plan) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground mb-4">Sem plano ativo.</p>
        <Button asChild className="bg-gradient-warm text-accent-foreground"><Link to="/app/onboarding">Gerar plano</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Cronograma</h1>
        <p className="text-muted-foreground mt-1">{plan.title}</p>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-7 text-xs uppercase tracking-wider bg-secondary text-secondary-foreground">
          {days.map((d) => <div key={d} className="p-3 text-center font-medium border-r last:border-r-0 border-border">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 min-h-[60vh]">
          {days.map((d) => {
            const block = blocks.find((b: any) => b.day === d);
            return (
              <div key={d} className="border-r last:border-r-0 border-border p-2 space-y-2">
                {block?.items?.map((it: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-2.5 text-xs hover:shadow-soft transition-smooth">
                    <div className="font-medium text-foreground line-clamp-2">{it.topic}</div>
                    <div className="text-muted-foreground mt-1">{it.subject}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent">
                      {it.duration_min}m · {it.kind}
                    </div>
                  </div>
                ))}
                {!block?.items?.length && <div className="text-[11px] text-muted-foreground/50 text-center py-4">livre</div>}
              </div>
            );
          })}
        </div>
      </div>

      {(plan.data_json as any)?.tips?.length > 0 && (
        <div className="rounded-2xl bg-gradient-surface border border-border p-6">
          <h3 className="font-display text-xl mb-3">Dicas do seu coach</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(plan.data_json as any).tips.map((t: string, i: number) => <li key={i}>· {t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Schedule;