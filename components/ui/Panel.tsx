import { ReactNode } from "react";
import Card from "./Card";

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function Panel({
  title,
  subtitle,
  action,
  children,
}: PanelProps) {
  return (
    <Card className="w-full rounded-3xl border border-blue-100 bg-white p-6 shadow-lg transition hover:shadow-xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">        <div>
        <h2 className="text-xl font-bold text-[#142A52]">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full">{children}</div>
    </Card>
  );
}