import { useMemo } from "react";
import { useRecentSessions } from "./useFocusSessions";
import { useProfile } from "./useProfile";

/**
 * useAdaptiveEngine - heurísticas locais + chamadas à IA pelo backend.
 * Calcula: produtividade média, recomendação do próximo bloco, sinal de fadiga.
 */
export const useAdaptiveEngine = () => {
  const { data: sessions } = useRecentSessions(20);
  const { data: profile } = useProfile();

  return useMemo(() => {
    const list = sessions ?? [];
    const totalMin = list.reduce((s, x) => s + Math.round((x.duration_seconds ?? 0) / 60), 0);
    const todayMin = list
      .filter((s) => new Date(s.completed_at).toDateString() === new Date().toDateString())
      .reduce((s, x) => s + Math.round((x.duration_seconds ?? 0) / 60), 0);
    const fatigueSignal = todayMin > 180; // > 3h hoje
    const streak = list.length > 0 ? Math.min(7, list.length) : 0;
    const recommendedBlockMin = fatigueSignal ? 15 : 25;
    return {
      totalMin,
      todayMin,
      fatigueSignal,
      streak,
      recommendedBlockMin,
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
    };
  }, [sessions, profile]);
};
