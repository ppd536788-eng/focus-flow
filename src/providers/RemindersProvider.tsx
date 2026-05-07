import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useActivePlan } from "@/hooks/useStudyPlan";
import { toast } from "sonner";

type Ctx = {
  permission: NotificationPermission | "unsupported";
  request: () => Promise<void>;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const RemindersContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "focoleve.reminders.enabled";
const FIRED_KEY = "focoleve.reminders.fired";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export const RemindersProvider = ({ children }: { children: React.ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const { data: plan } = useActivePlan();
  const intervalRef = useRef<number | null>(null);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  };

  const request = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") setEnabled(true);
  };

  useEffect(() => {
    if (!enabled || permission !== "granted" || !plan) return;
    const tick = () => {
      const now = new Date();
      const today = days[now.getDay()];
      const block = (plan.data_json as any)?.weekly_blocks?.find((b: any) => b.day === today);
      if (!block?.items?.length) return;
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const fired: Record<string, boolean> = JSON.parse(localStorage.getItem(FIRED_KEY) || "{}");
      block.items.forEach((it: any, idx: number) => {
        const time: string | undefined = it.start_time || it.time;
        if (!time) return;
        if (time.slice(0, 5) !== `${hh}:${mm}`) return;
        const key = `${now.toDateString()}-${idx}-${time}`;
        if (fired[key]) return;
        fired[key] = true;
        localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
        try {
          new Notification("Hora de focar ✨", {
            body: `${it.topic ?? "Estudo"} · ${it.subject ?? ""} (${it.duration_min ?? 25} min)`,
            icon: "/favicon.ico",
          });
        } catch {/* noop */}
        toast.info(`Hora de estudar: ${it.topic ?? it.subject}`);
      });
    };
    tick();
    intervalRef.current = window.setInterval(tick, 60_000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [enabled, permission, plan]);

  return (
    <RemindersContext.Provider value={{ permission, request, enabled, setEnabled }}>
      {children}
    </RemindersContext.Provider>
  );
};

export const useReminders = () => {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
};