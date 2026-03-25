"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Pin, PinOff, Lock, Unlock, Check, GripVertical,
  X, BellOff, Trash2, Loader2,
} from "lucide-react";

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

interface WidgetData {
  id: string;
  taskId: string | null;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  locked: boolean;
  dueAt: string | null;
  status: string;
}

interface ReminderPopup {
  widgetId: string;
  title: string;
  dueAt: string;
}

export default function WidgetsLabPage() {
  const t = useTranslations("widgets");
  const tc = useTranslations("common");
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [popup, setPopup] = useState<ReminderPopup | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from API
  useEffect(() => {
    fetch("/api/widgets")
      .then((r) => r.json())
      .then((data) => setWidgets(data.widgets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Overdue popup
  useEffect(() => {
    const now = new Date();
    const overdue = widgets.find(
      (w) => w.dueAt && new Date(w.dueAt) < now && w.status !== "done"
    );
    if (overdue && !popup) {
      setPopup({ widgetId: overdue.id, title: overdue.title, dueAt: overdue.dueAt! });
    }
  }, [widgets, popup]);

  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, id: string) => {
      const w = widgets.find((w) => w.id === id);
      if (!w || w.locked) return;
      e.preventDefault();
      const coords = getCoords(e);
      setDragging(id);
      dragOffset.current = { x: coords.x - w.x, y: coords.y - w.y };
    },
    [widgets, getCoords]
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragging || !containerRef.current) return;
      const coords = getCoords(e);
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(coords.x - dragOffset.current.x, rect.width - 220));
      const y = Math.max(0, Math.min(coords.y - dragOffset.current.y - rect.top, rect.height - 140));
      setWidgets((prev) => prev.map((w) => (w.id === dragging ? { ...w, x, y } : w)));
    },
    [dragging, getCoords]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragging) return;
    const w = widgets.find((w) => w.id === dragging);
    if (w) {
      fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", widgetId: w.id, x: w.x, y: w.y }),
      }).catch(() => {});
    }
    setDragging(null);
  }, [dragging, widgets]);

  const persist = (id: string, props: Record<string, unknown>) => {
    fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", widgetId: id, ...props }),
    }).catch(() => {});
  };

  const togglePin = (id: string) => {
    setWidgets((prev) => {
      const w = prev.find((w) => w.id === id);
      if (w) persist(id, { pinned: !w.pinned });
      return prev.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w));
    });
  };

  const toggleLock = (id: string) => {
    setWidgets((prev) => {
      const w = prev.find((w) => w.id === id);
      if (w) persist(id, { locked: !w.locked });
      return prev.map((w) => (w.id === id ? { ...w, locked: !w.locked } : w));
    });
  };

  const setColor = (id: string, color: string) => {
    persist(id, { color });
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, color } : w)));
  };

  const markDone = (id: string) => {
    fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", widgetId: id }),
    }).catch(() => {});
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, status: "done" } : w)));
  };

  const removeWidget = (id: string) => {
    fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", widgetId: id }),
    }).catch(() => {});
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const isOverdue = (dueAt: string | null, status: string) =>
    dueAt && new Date(dueAt) < new Date() && status !== "done";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      {popup && (
        <Card className="p-4 border-warning/40 bg-warning/5 relative">
          <button onClick={() => setPopup(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <BellOff size={18} className="text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t("reminder", { title: popup.title })}</p>
              <p className="text-xs text-muted-foreground">{tc("overdue")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPopup(null)}>{tc("snooze")}</Button>
              <Button variant="accent" size="sm" onClick={() => { markDone(popup.widgetId); setPopup(null); }}>{tc("done")}</Button>
            </div>
          </div>
        </Card>
      )}

      <div
        ref={containerRef}
        className="relative bg-muted/30 border border-dashed border-border rounded-lg overflow-hidden select-none touch-none"
        style={{ height: "520px" }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {widgets.map((widget) => {
          const overdue = isOverdue(widget.dueAt, widget.status);
          return (
            <div
              key={widget.id}
              className={`absolute rounded-lg shadow-md border transition-shadow ${
                dragging === widget.id ? "shadow-lg z-50" : ""
              } ${widget.status === "done" ? "opacity-40" : ""} ${
                overdue ? "ring-2 ring-destructive/50" : ""
              }`}
              style={{
                left: widget.x, top: widget.y,
                width: widget.width, height: widget.height,
                backgroundColor: `${widget.color}10`,
                borderColor: `${widget.color}40`,
              }}
            >
              <div
                className={`flex items-center gap-1 px-3 py-2 rounded-t-lg ${widget.locked ? "cursor-not-allowed" : "cursor-grab"} ${dragging === widget.id ? "cursor-grabbing" : ""}`}
                style={{ backgroundColor: `${widget.color}20` }}
                onMouseDown={(e) => handleDragStart(e, widget.id)}
                onTouchStart={(e) => handleDragStart(e, widget.id)}
              >
                <GripVertical size={14} style={{ color: widget.color }} />
                <span className="text-xs font-semibold flex-1 truncate" style={{ color: widget.color }}>
                  {widget.title}
                </span>
                {widget.pinned && <Pin size={10} style={{ color: widget.color }} />}
                {widget.locked && <Lock size={10} style={{ color: widget.color }} />}
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant={widget.status === "done" ? "success" : overdue ? "destructive" : "outline"} className="text-[10px]">
                    {overdue ? tc("overdue") : widget.status}
                  </Badge>
                  {widget.dueAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(widget.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePin(widget.id)} className="p-1 rounded hover:bg-black/5"><Pin size={11} /></button>
                  <button onClick={() => toggleLock(widget.id)} className="p-1 rounded hover:bg-black/5">{widget.locked ? <Unlock size={11} /> : <Lock size={11} />}</button>
                  {widget.status !== "done" && <button onClick={() => markDone(widget.id)} className="p-1 rounded hover:bg-black/5"><Check size={11} /></button>}
                  <button onClick={() => removeWidget(widget.id)} className="p-1 rounded hover:bg-black/5 text-muted-foreground"><Trash2 size={11} /></button>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(widget.id, c)}
                      className={`w-3 h-3 rounded-full border-2 ${widget.color === c ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <p>{t("noWidgets")}</p>
            <p className="text-xs">{t("noWidgetsHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
