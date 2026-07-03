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
  children,
  action,
}: PanelProps) {
  return (
    <Card className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-2 text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </Card>
  );
}