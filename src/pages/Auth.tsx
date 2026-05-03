import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [params] = useSearchParams();
  const initial = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initial as any);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => { if (session) navigate("/app", { replace: true }); }, [session, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada — bem-vindo!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-night text-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -left-20 size-[500px] rounded-full bg-accent/20 blur-3xl" />
        <Link to="/" className="font-display text-xl tracking-tight inline-flex items-center gap-2 relative">
          <span className="size-7 rounded-lg bg-gradient-warm grid place-items-center text-accent-foreground">
            <Sparkles className="size-4" />
          </span>
          Foco Leve
        </Link>
        <div className="relative">
          <p className="font-display text-4xl leading-tight max-w-md text-balance">
            "Não é sobre estudar mais.<br /><span className="italic text-accent">É sobre estudar com menos atrito."</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl mb-2">{mode === "signup" ? "Criar conta" : "Entrar"}</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "signup" ? "Comece em menos de 30 segundos." : "Continue de onde parou."}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamamos?" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow" disabled={loading}>
              {loading ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signup" ? "Já tem conta? Entrar" : "Não tem conta? Criar agora"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
