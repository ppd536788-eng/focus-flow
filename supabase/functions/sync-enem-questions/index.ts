import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API = "https://api.enem.dev/v1";
const PAGE_LIMIT = 50;

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function mapDiscipline(d?: string): string {
  const map: Record<string, string> = {
    "linguagens": "Linguagens",
    "ciencias-humanas": "Humanas",
    "ciencias-natureza": "Natureza",
    "matematica": "Matemática",
  };
  return map[d ?? ""] ?? (d ?? "Geral");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const targetYears: number[] | undefined = body.years;
  const maxPerYear: number = Math.min(body.maxPerYear ?? 60, 200);

  const { data: logRow } = await supabase
    .from("sync_logs")
    .insert({ job: "sync-enem", status: "running", details: { targetYears, maxPerYear } })
    .select().single();

  const summary: any = { years: [], inserted: 0, skipped: 0, errors: [] };

  try {
    // 1) exams list
    const examsResp = await fetchJson(`${API}/exams`);
    const examsList: any[] = Array.isArray(examsResp) ? examsResp : (examsResp.exams ?? []);

    for (const ex of examsList) {
      const year = Number(ex.year ?? ex.id);
      if (!Number.isFinite(year)) continue;
      if (targetYears && !targetYears.includes(year)) continue;

      try {
        const exam = await fetchJson(`${API}/exams/${year}`);
        await supabase.from("exams").upsert({
          year,
          title: exam.title ?? `ENEM ${year}`,
          disciplines: exam.disciplines ?? [],
          languages: exam.languages ?? [],
          last_synced_at: new Date().toISOString(),
        }, { onConflict: "year" });

        // 2) questions paginated
        let offset = 0;
        let fetched = 0;
        while (fetched < maxPerYear) {
          const limit = Math.min(PAGE_LIMIT, maxPerYear - fetched);
          const page = await fetchJson(
            `${API}/exams/${year}/questions?limit=${limit}&offset=${offset}`,
          );
          const items: any[] = page.questions ?? page.items ?? page ?? [];
          if (!items.length) break;

          const rows = items.map((q: any) => {
            const alts: any[] = q.alternatives ?? [];
            const choices = alts.map((a: any) => ({
              id: String(a.letter ?? a.id ?? "").toLowerCase(),
              text: String(a.text ?? a.content ?? ""),
            }));
            const correct = String(q.correctAlternative ?? q.correct_alternative ?? "").toLowerCase();
            const discipline = mapDiscipline(q.discipline);
            return {
              year,
              index: Number(q.index),
              discipline,
              language: q.language ?? "",
              statement: String(q.context ? `${q.context}\n\n${q.alternativesIntroduction ?? ""}\n\n${q.title ?? ""}` : (q.title ?? q.statement ?? "")).trim(),
              context: q.context ?? null,
              image_url: q.files?.[0] ?? null,
              files: q.files ?? [],
              alternatives_json: alts,
              correct_alternative: correct,
              correct_choice: correct,
              choices,
              subject: discipline,
              topic: q.discipline ?? null,
              difficulty: "medium",
              explanation: q.explanation ?? null,
              source: "enem.dev",
            };
          }).filter((r) => r.index >= 0 && r.statement && r.choices.length > 0);

          if (rows.length) {
            const { error } = await supabase
              .from("questions")
              .upsert(rows, { onConflict: "year,index,language", ignoreDuplicates: false });
            if (error) summary.errors.push({ year, offset, error: error.message });
            else summary.inserted += rows.length;
          }

          fetched += items.length;
          offset += items.length;
          if (items.length < limit) break;
        }

        summary.years.push({ year, fetched });
      } catch (e) {
        summary.errors.push({ year, error: String(e) });
      }
    }

    await supabase.from("sync_logs").update({
      status: summary.errors.length ? "partial" : "success",
      details: summary,
      finished_at: new Date().toISOString(),
    }).eq("id", logRow!.id);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    await supabase.from("sync_logs").update({
      status: "error",
      details: { error: String(e), summary },
      finished_at: new Date().toISOString(),
    }).eq("id", logRow!.id);
    return new Response(JSON.stringify({ error: String(e), summary }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});