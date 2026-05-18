import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent, type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useActivePlan, useUpdatePlanData, useAdaptPlan } from "@/hooks/useStudyPlan";
import { toast } from "sonner";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"] as const;
type Day = typeof DAYS[number];
type Item = { uid: string; subject: string; topic: string; duration_min: number; kind: string };
type Board = Record<Day, Item[]>;

const Schedule = () => {
  const { data: plan, isLoading } = useActivePlan();
  const update = useUpdatePlanData();
  const adapt = useAdaptPlan();
  const [board, setBoard] = useState<Board | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ day: Day; uid?: string; item: Omit<Item, "uid"> } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Initialize board from plan
  useEffect(() => {
    if (!plan) return;
    const blocks = (plan.data_json as any)?.weekly_blocks ?? [];
    const next: Board = { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [], Sab: [], Dom: [] };
    DAYS.forEach((d) => {
      const found = blocks.find((b: any) => b.day === d);
      next[d] = (found?.items ?? []).map((it: any, i: number) => ({
        uid: `${d}-${i}-${it.topic}`, ...it,
      }));
    });
    setBoard(next);
  }, [plan]);

  const findContainer = (uid: string): Day | null => {
    if (!board) return null;
    if ((DAYS as readonly string[]).includes(uid)) return uid as Day;
    for (const d of DAYS) if (board[d].some((i) => i.uid === uid)) return d;
    return null;
  };

  const activeItem = useMemo(() => {
    if (!activeId || !board) return null;
    for (const d of DAYS) {
      const f = board[d].find((i) => i.uid === activeId);
      if (f) return f;
    }
    return null;
  }, [activeId, board]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!board || !e.over) return;
    const fromId = String(e.active.id);
    const toId = String(e.over.id);
    const from = findContainer(fromId);
    const to = findContainer(toId);
    if (!from || !to) return;

    const next: Board = { ...board, [from]: [...board[from]] };
    if (from === to) {
      const oldIdx = next[from].findIndex((i) => i.uid === fromId);
      const newIdx = next[from].findIndex((i) => i.uid === toId);
      if (oldIdx === -1 || newIdx === -1) return;
      next[from] = arrayMove(next[from], oldIdx, newIdx);
    } else {
      next[to] = [...board[to]];
      const oldIdx = next[from].findIndex((i) => i.uid === fromId);
      if (oldIdx === -1) return;
      const [moved] = next[from].splice(oldIdx, 1);
      const overIdx = (DAYS as readonly string[]).includes(toId)
        ? next[to].length
        : next[to].findIndex((i) => i.uid === toId);
      next[to].splice(overIdx === -1 ? next[to].length : overIdx, 0, moved);
    }
    setBoard(next);
    persist(next);
  };

  const persist = (b: Board) => {
    if (!plan) return;
    const weekly_blocks = DAYS.map((d) => ({
      day: d,
      items: b[d].map(({ uid, ...rest }) => rest),
    }));
    update.mutate(
      { id: plan.id, data_json: { ...(plan.data_json as any), weekly_blocks } },
      { onError: () => toast.error("Não foi possível salvar a alteração") }
    );
  };

  const saveEdit = () => {
    if (!editing || !board) return;
    const { day, uid, item } = editing;
    if (!item.subject.trim() || !item.topic.trim()) {
      toast.error("Preencha matéria e assunto");
      return;
    }
    const next: Board = { ...board, [day]: [...board[day]] };
    if (uid) {
      const i = next[day].findIndex((x) => x.uid === uid);
      if (i !== -1) next[day][i] = { ...next[day][i], ...item };
    } else {
      next[day].push({ uid: `${day}-${Date.now()}-${item.topic}`, ...item });
    }
    setBoard(next);
    persist(next);
    setEditing(null);
  };

  const deleteEdit = () => {
    if (!editing || !editing.uid || !board) return;
    const { day, uid } = editing;
    const next: Board = { ...board, [day]: board[day].filter((x) => x.uid !== uid) };
    setBoard(next);
    persist(next);
    setEditing(null);
  };

  const onAdapt = () => {
    adapt.mutate(undefined, {
      onSuccess: () => toast.success("Plano adaptado ao seu desempenho recente"),
      onError: (e: any) => toast.error(`Falha ao adaptar: ${e.message ?? "erro"}`),
    });
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!plan) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground mb-4">Sem plano ativo.</p>
        <Button asChild className="bg-gradient-warm text-accent-foreground"><Link to="/app/onboarding">Gerar plano</Link></Button>
      </div>
    );
  }
  if (!board) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Cronograma</h1>
          <p className="text-muted-foreground mt-1">{plan.title}</p>
          <p className="text-xs text-muted-foreground mt-1">Arraste blocos para reorganizar — alterações salvam automaticamente.</p>
        </div>
        <Button onClick={onAdapt} disabled={adapt.isPending}
          className="bg-gradient-focus text-focus-foreground hover:opacity-90 shadow-focus">
          {adapt.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
          Adaptar com IA
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="grid grid-cols-7 text-xs uppercase tracking-wider bg-secondary text-secondary-foreground">
            {DAYS.map((d) => <div key={d} className="p-3 text-center font-medium border-r last:border-r-0 border-border">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 min-h-[60vh]">
            {DAYS.map((d) => (
              <DayColumn
                key={d}
                day={d}
                items={board[d]}
                onEdit={(it) => setEditing({ day: d, uid: it.uid, item: { subject: it.subject, topic: it.topic, duration_min: it.duration_min, kind: it.kind } })}
                onAdd={() => setEditing({ day: d, item: { subject: "", topic: "", duration_min: 30, kind: "estudo" } })}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeItem ? <ItemCard item={activeItem} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.uid ? "Editar bloco" : "Novo bloco"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Matéria</Label>
                <Input value={editing.item.subject}
                  onChange={(e) => setEditing({ ...editing, item: { ...editing.item, subject: e.target.value } })}
                  placeholder="Ex.: Matemática" />
              </div>
              <div>
                <Label>Assunto</Label>
                <Input value={editing.item.topic}
                  onChange={(e) => setEditing({ ...editing, item: { ...editing.item, topic: e.target.value } })}
                  placeholder="Ex.: Funções do 2º grau" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" min={5} step={5} value={editing.item.duration_min}
                    onChange={(e) => setEditing({ ...editing, item: { ...editing.item, duration_min: Number(e.target.value) || 0 } })} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input value={editing.item.kind}
                    onChange={(e) => setEditing({ ...editing, item: { ...editing.item, kind: e.target.value } })}
                    placeholder="estudo, revisão, exercícios" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {editing?.uid && (
              <Button variant="outline" onClick={deleteEdit} className="mr-auto text-destructive">
                <Trash2 className="size-4 mr-1" /> Remover
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} className="bg-gradient-warm text-accent-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(plan.data_json as any)?.tips?.length > 0 && (
        <div className="rounded-2xl bg-gradient-surface border border-border p-6">
          <h3 className="font-display text-xl mb-3">Dicas do seu coach</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(plan.data_json as any).tips.map((t: string, i: number) => <li key={i}>· {t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

const DayColumn = ({ day, items, onEdit, onAdd }: { day: Day; items: Item[]; onEdit: (it: Item) => void; onAdd: () => void }) => {
  const { setNodeRef, isOver } = useDroppable({ id: day });
  return (
    <SortableContext id={day} items={items.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef}
        className={`border-r last:border-r-0 border-border p-2 space-y-2 transition-colors ${isOver ? "bg-accent/5" : ""}`}>
        {items.map((it) => <SortableItem key={it.uid} item={it} onEdit={() => onEdit(it)} />)}
        {!items.length && <div className="text-[11px] text-muted-foreground/50 text-center py-4">livre</div>}
        <button
          onClick={onAdd}
          className="w-full mt-1 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 py-1.5 rounded-md border border-dashed border-border hover:border-accent/50 transition-smooth"
        >
          <Plus className="size-3" /> adicionar
        </button>
      </div>
    </SortableContext>
  );
};

const SortableItem = ({ item, onEdit }: { item: Item; onEdit: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard item={item} dragHandleProps={{ ...attributes, ...listeners }} onEdit={onEdit} />
    </div>
  );
};

const ItemCard = ({ item, dragging, dragHandleProps, onEdit }: { item: Item; dragging?: boolean; dragHandleProps?: any; onEdit?: () => void }) => (
  <motion.div
    layout
    className={`group rounded-lg border bg-background p-2.5 text-xs select-none
      ${dragging ? "border-accent shadow-glow" : "border-border hover:shadow-soft"}`}>
    <div className="flex items-start gap-1.5">
      <button
        {...(dragHandleProps ?? {})}
        className="cursor-grab active:cursor-grabbing touch-none mt-0.5 shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Arrastar"
      >
        <GripVertical className="size-3" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="inline-block px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-semibold uppercase tracking-wider mb-1">
          {item.subject}
        </div>
        <div className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{item.topic}</div>
        <div className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
          {item.duration_min} min · {item.kind}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
          aria-label="Editar bloco"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  </motion.div>
);

export default Schedule;