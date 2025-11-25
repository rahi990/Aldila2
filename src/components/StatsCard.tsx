import { cn } from "@/lib/utils";

interface StatsCardProps {
    label: string;
    value: string | number;
    className?: string;
}

export function StatsCard({ label, value, className }: StatsCardProps) {
    return (
        <div className={cn("bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center shadow-sm", className)}>
            <span className="text-muted-foreground text-sm font-medium mb-1">{label}</span>
            <span className="text-foreground text-xl font-bold">{value}</span>
        </div>
    );
}
