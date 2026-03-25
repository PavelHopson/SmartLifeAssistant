import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
