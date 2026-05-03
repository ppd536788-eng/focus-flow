import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export const useQuestions = (subject?: string) => {
  return useQuery({
    queryKey: ["questions", subject ?? "all"],
    queryFn: async () => {
      let q = supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (subject) q = q.eq("subject", subject);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useSubmitAttempt = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { question_id: string; chosen: string; is_correct: boolean }) => {
      const { data, error } = await supabase
        .from("question_attempts")
        .insert({ user_id: user!.id, ...input })
        .select().single();
      if (error) throw error;

      // grant XP for correct answers
      if (input.is_correct) {
        const { data: prof } = await supabase
          .from("profiles").select("xp,level").eq("user_id", user!.id).single();
        const xp = (prof?.xp ?? 0) + 10;
        const level = Math.max(1, Math.floor(xp / 200) + 1);
        await supabase.from("profiles").update({ xp, level }).eq("user_id", user!.id);
      }

      await supabase.from("analytics_events").insert({
        user_id: user!.id,
        event_type: "question_answered",
        metadata_json: input as any,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

export const useExplainError = () => {
  return useMutation({
    mutationFn: async (input: { question: string; userAnswer: string; correctAnswer: string; subject?: string }) => {
      const { data, error } = await supabase.functions.invoke("analyze-answer", { body: input });
      if (error) throw error;
      return data as { explanation: string };
    },
  });
};