import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.105.1/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MANUS_URL = "https://api.manus.ai/v2/chat/completions";

interface Body { goal: string; hoursPerWeek: number; subjects: string[]; weakPoints?: string }

const SYSTEM = `Você é um coach educacional especialista em planos de estudo adaptativos.
Gere um plano semanal estruturado em JSON com a forma:
{ "summary": string, "weekly_blocks": [ { "day": "Seg|Ter|Qua|Qui|Sex|Sab|Dom", "items": [ { "subject": string, "topic": string, "duration_min": number, "kind": "estudo|revisao|exercicio" } ] } ], "tips": [string] }
Distribua a carga total respeitando hoursPerWeek e priorize weakPoints.`;

async function callManus(body: any, key: string) {
  const r = await fetch(MANUS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`manus ${r.status}`);
  return r.json();
}

async function callLovable(body: any, key: string) {
  const r = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("rate_limited");
  if (r.status === 402) throw new Error("payment_required");
  if (!r.ok) throw new Error(`lovable ${r.status}`);
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

    const { goal, hoursPerWeek, subjects, weakPoints } = (await req.json()) as Body;
    if (!goal || !subjects?.length || !hoursPerWeek) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userMsg = `Objetivo: ${goal}\nMatérias: ${subjects.join(", ")}\nHoras por semana: ${hoursPerWeek}\nPontos fracos: ${weakPoints || "n/a"}`;
    const payload = {
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
      tools: [{
        type: "function",
        function: {
          name: "emit_plan",
          description: "Emit weekly study plan",
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

    let result: any;
    let used = "manus";
    const MANUS_KEY = Deno.env.get("MANUS_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    try {
      if (!MANUS_KEY) throw new Error("no_manus_key");
      result = await callManus(payload, MANUS_KEY);
    } catch (e) {
      console.warn("Manus failed, falling back to Lovable AI:", (e as Error).message);
      if (!LOVABLE_KEY) throw new Error("no_ai_provider");
      used = "lovable";
      result = await callLovable({ ...payload, model: "google/gemini-3-flash-preview" }, LOVABLE_KEY);
    }

    const tc = result.choices?.[0]?.message?.tool_calls?.[0];
    const planJson = tc ? JSON.parse(tc.function.arguments) : (() => {
      try { return JSON.parse(result.choices?.[0]?.message?.content ?? "{}"); } catch { return {}; }
    })();

    // Persist
    await sb.from("study_plans").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);
    const { data: plan, error: insErr } = await sb
      .from("study_plans")
      .insert({ user_id: user.id, title: goal.slice(0, 80), data_json: planJson, is_adaptive: true, is_active: true })
      .select().single();
    if (insErr) throw insErr;
    await sb.from("profiles").update({ current_plan: plan.id, onboarding_completed: true }).eq("user_id", user.id);
    await sb.from("analytics_events").insert({ user_id: user.id, event_type: "plan_generated", metadata_json: { provider: used } });

    return new Response(JSON.stringify({ plan, provider: used }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan error:", e);
    const msg = (e as Error).message;
    const status = msg === "rate_limited" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
