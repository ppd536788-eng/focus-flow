import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.105.1/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MANUS_URL = "https://api.manus.ai/v2/chat/completions";

const SYSTEM = `Você é um tutor que explica erros em questões de prova de forma clara, curta (máx 6 frases) e didática. Aponte o conceito que falhou e dê 1 dica de revisão.`;

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

    const { question, userAnswer, correctAnswer, subject } = await req.json();

    const userMsg = `Matéria: ${subject || "n/a"}\nQuestão: ${question}\nResposta do aluno: ${userAnswer}\nResposta correta: ${correctAnswer}`;
    const payload = {
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
    };

    const MANUS_KEY = Deno.env.get("MANUS_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    let text = "";
    try {
      if (!MANUS_KEY) throw new Error("no_manus_key");
      const r = await fetch(MANUS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${MANUS_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`manus ${r.status}`);
      const j = await r.json();
      text = j.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      console.warn("Manus failed, fallback Lovable AI:", (e as Error).message);
      if (!LOVABLE_KEY) throw new Error("no_ai_provider");
      const r = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, model: "google/gemini-3-flash-preview" }),
      });
      if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!r.ok) throw new Error(`lovable ${r.status}`);
      const j = await r.json();
      text = j.choices?.[0]?.message?.content ?? "";
    }

    await sb.from("analytics_events").insert({
      user_id: user.id,
      event_type: "answer_analyzed",
      metadata_json: { subject, correct: false },
    });

    return new Response(JSON.stringify({ explanation: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-answer error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
