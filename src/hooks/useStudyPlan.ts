import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export const useActivePlan = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["active-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useGeneratePlan = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { goal: string; hoursPerWeek: number; subjects: string[]; weakPoints?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-plan", { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-plan", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};
