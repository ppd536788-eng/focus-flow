import { PomodoroTimer } from "@/components/focus/PomodoroTimer";
import { PanicButton } from "@/components/focus/PanicButton";
import { useAdaptiveEngine } from "@/hooks/useAdaptiveEngine";

const Focus = () => {
  const eng = useAdaptiveEngine();
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Foco</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {eng.fatigueSignal
            ? "Você já estudou bastante hoje. Sugerimos blocos curtos de 15 min."
            : `Bloco recomendado pelo seu ritmo: ${eng.recommendedBlockMin} min.`}
        </p>
      </div>
      <PomodoroTimer />
      <div className="flex justify-center"><PanicButton /></div>
    </div>
  );
};

export default Focus;