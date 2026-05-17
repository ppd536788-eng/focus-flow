import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, User, Bell, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { useReminders } from "@/providers/RemindersProvider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const reminders = useReminders();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [chronotype, setChronotype] = useState<string>("morning");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("sync_logs").select("finished_at,status").eq("job", "sync-enem")
      .order("started_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.finished_at) setLastSync(data.finished_at); });
  }, []);

  const runSync = async () => {
    setSyncing(true);
    const t = toast.loading("Sincronizando questões do ENEM…");
    const { data, error } = await supabase.functions.invoke("sync-enem-questions", {
      body: { maxPerYear: 60 },
    });
    setSyncing(false);
    toast.dismiss(t);
    if (error) { toast.error("Falha ao sincronizar"); return; }
    toast.success(`Sincronizado: ${data?.inserted ?? 0} questões`);
    setLastSync(new Date().toISOString());
  };

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      const cp: any = profile.cognitive_profile ?? {};
      setGoal(cp.goal ?? "");
      setChronotype(cp.chronotype ?? "morning");
    }
  }, [profile]);

  const save = () => {
    update.mutate(
      { display_name: name, cognitive_profile: { ...(profile?.cognitive_profile as any), goal, chronotype } },
      { onSuccess: () => toast.success("Perfil atualizado") }
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Ajustes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Personalize seu perfil cognitivo.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-warm grid place-items-center text-accent-foreground">
            <User className="size-5" />
          </div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Como podemos te chamar?</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Seu objetivo principal</Label>
          <Textarea id="goal" rows={3} value={goal} onChange={(e) => setGoal(e.target.value)}
            placeholder="Ex: Passar no ENEM com nota acima de 700 em redação." />
        </div>

        <div className="space-y-2">
          <Label>Quando rende mais?</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "morning", label: "Manhã" },
              { id: "afternoon", label: "Tarde" },
              { id: "night", label: "Noite" },
            ].map((c) => (
              <button key={c.id} onClick={() => setChronotype(c.id)}
                className={`rounded-xl border p-3 text-sm font-medium transition-smooth
                  ${chronotype === c.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-accent"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={update.isPending}
            className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
            {update.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Salvar
          </Button>
          <Button variant="ghost" onClick={signOut}>Sair</Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-warm grid place-items-center text-accent-foreground">
            <Bell className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg">Lembretes de estudo</div>
            <div className="text-xs text-muted-foreground">Avisos no horário dos seus blocos.</div>
          </div>
        </div>
        {reminders.permission === "unsupported" ? (
          <p className="text-sm text-muted-foreground">Seu navegador não suporta notificações.</p>
        ) : reminders.permission !== "granted" ? (
          <Button variant="outline" onClick={reminders.request}>Permitir notificações</Button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm">Lembretes ativados</span>
            <Switch checked={reminders.enabled} onCheckedChange={reminders.setEnabled} />
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-warm grid place-items-center text-accent-foreground">
            <Database className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg">Banco de questões ENEM</div>
            <div className="text-xs text-muted-foreground">
              {lastSync ? `Última sincronização: ${new Date(lastSync).toLocaleString("pt-BR")}` : "Nunca sincronizado"}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={runSync} disabled={syncing}>
          {syncing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
          Sincronizar agora
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;