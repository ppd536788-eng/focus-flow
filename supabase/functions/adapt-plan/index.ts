import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.105.1/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MANUS_URL = "https://api.manus.ai/v2/chat/completions";

const SYSTEM = `Você é um coach educacional adaptativo. Receberá o plano semanal atual de um aluno em JSON e estatísticas de desempenho recente (sessões, acertos, erros por matéria).
Sua tarefa: emitir UM novo plano semanal em JSON no MESMO formato, ajustando carga, prioridades e revisões para reforçar pontos fracos e respeitar a energia do aluno (reduza blocos se houver fadiga, aumente revisão de matérias com baixa taxa de acerto).
Formato esperado:
{ "summary": string, "weekly_blocks": [ { "day": "Seg|Ter|Qua|Qui|Sex|Sab|Dom", "items": [ { "subject": string, "topic": string, "duration_min": number, "kind": "estudo|revisao|exercicio" } ] } ], "tips": [string] }`;

async function callJSON(url: string, key: string, body: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("rate_limited");
  if (r.status === 402) throw new Error("payment_required");
  if (!r.ok) throw new Error(`http_${r.status}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Active plan
    const { data: plan } = await sb.from("study_plans").select("*")
      .eq("user_id", user.id).eq("is_active", true)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!plan) return new Response(JSON.stringify({ error: "no_active_plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Recent performance
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: sessions }, { data: attempts }] = await Promise.all([
      sb.from("focus_sessions").select("duration_seconds,topic_label,completed_at").eq("user_id", user.id).gte("completed_at", since),
      sb.from("question_attempts").select("is_correct,question_id,created_at,questions(subject,topic)").eq("user_id", user.id).gte("created_at", since),
    ]);

    const subjectStats: Record<string, { total: number; correct: number }> = {};
    (attempts ?? []).forEach((a: any) => {
      const s = a.questions?.subject ?? "geral";
      subjectStats[s] = subjectStats[s] || { total: 0, correct: 0 };
      subjectStats[s].total++;
      if (a.is_correct) subjectStats[s].correct++;
    });
    const totalMin = (sessions ?? []).reduce((acc, s: any) => acc + Math.round((s.duration_seconds ?? 0) / 60), 0);

    const userMsg = `PLANO ATUAL:\n${JSON.stringify(plan.data_json)}\n\nDESEMPENHO 14 DIAS:\n- Minutos focados: ${totalMin}\n- Sessões: ${sessions?.length ?? 0}\n- Acertos por matéria: ${JSON.stringify(subjectStats)}\n\nGere o plano adaptado.`;

    const payload = {
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
      tools: [{
        type: "function",
        function: {
          name: "emit_plan",
          description: "Emit adapted weekly study plan",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string" },
              weekly_blocks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          subject: { type: "string" },
                          topic: { type: "string" },
                          duration_min: { type: "number" },
                          kind: { type: "string", enum: ["estudo", "revisao", "exercicio"] },
                        },
                        required: ["subject", "topic", "duration_min", "kind"],
                      },
                    },
                  },
                  required: ["day", "items"],
                },
              },
              tips: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "weekly_blocks", "tips"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "emit_plan" } },
    };

    let result: any; let used = "manus";
    const MANUS_KEY = Deno.env.get("MANUS_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    try {
      if (!MANUS_KEY) throw new Error("no_manus_key");
      result = await callJSON(MANUS_URL, MANUS_KEY, payload);
    } catch (e) {
      console.warn("Manus failed, fallback Lovable:", (e as Error).message);
      if (!LOVABLE_KEY) throw new Error("no_ai_provider");
      used = "lovable";
      result = await callJSON(LOVABLE_AI_URL, LOVABLE_KEY, { ...payload, model: "google/gemini-3-flash-preview" });
    }

    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    const planJson = tc ? JSON.parse(tc.function.arguments) : {};

    await sb.from("study_plans").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);
    const { data: newPlan, error: insErr } = await sb.from("study_plans")
      .insert({ user_id: user.id, title: plan.title, data_json: planJson, is_adaptive: true, is_active: true })
      .select().single();
    if (insErr) throw insErr;
    await sb.from("profiles").update({ current_plan: newPlan.id }).eq("user_id", user.id);
    await sb.from("analytics_events").insert({ user_id: user.id, event_type: "plan_adapted", metadata_json: { provider: used, totalMin, subjectStats } });

    return new Response(JSON.stringify({ plan: newPlan, provider: used }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adapt-plan error:", e);
    const msg = (e as Error).message;
    const status = msg === "rate_limited" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});