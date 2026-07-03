import Card from "./Card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  description,
}: StatCardProps) {
  return (
    <Card className="relative p-5 overflow-hidden">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {label}
          </p>

          <h2 className="mt-3 text-4xl font-black text-[#142A52]">
            {value}
          </h2>

          {description && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#4267A8]">
          {icon}
        </div>
      </div>
    </Card>
  );
}