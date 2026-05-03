import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export const useRecentSessions = (limit = 10) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sessions", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions").select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useLogSession = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { duration_seconds: number; topic_label?: string; topic_id?: string; xp_earned?: number }) => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({ user_id: user!.id, ...s })
        .select().single();
      if (error) throw error;
      // grant XP on profile
      if (s.xp_earned) {
        const { data: prof } = await supabase
          .from("profiles").select("xp,level").eq("user_id", user!.id).single();
        const xp = (prof?.xp ?? 0) + s.xp_earned;
        const level = Math.max(1, Math.floor(xp / 200) + 1);
        await supabase.from("profiles").update({ xp, level }).eq("user_id", user!.id);
      }
      await supabase.from("analytics_events").insert({
        user_id: user!.id,
        event_type: "focus_session_completed",
        metadata_json: s as any,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};
