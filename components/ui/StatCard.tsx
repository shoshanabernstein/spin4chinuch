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
    <Card className="rounded-3xl border border-blue-100 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            {label}
          </p>

          <h2 className="mt-2 text-4xl font-black leading-none text-[#142A52]">
            {value}
          </h2>

          {description && (
            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="ml-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#4267A8]">
          {icon}
        </div>
      </div>
    </Card>
  );
}