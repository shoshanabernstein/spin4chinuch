/* eslint-disable @next/next/no-img-element */
import { Gift } from "lucide-react";
import Card from "@/components/ui/Card";
import { getPrizeDisplay } from "@/lib/prize-display";
import { getPrizeLogo } from "@/lib/prize-logo";
import type { ReactNode } from "react";
import styles from "./PrizeCard.module.css";

interface PrizeCardProps {
  name: string;
  imageUrl?: string | null;
  originalQuantity?: number | null;
  sponsorName?: string | null;
  children?: ReactNode;
  compact?: boolean;
  gallery?: boolean;
  playful?: boolean;
}

export default function PrizeCard({
  name, imageUrl, originalQuantity, sponsorName, children,
  compact = false,
}: PrizeCardProps) {
  const display = getPrizeDisplay(name, sponsorName);
  const logo = imageUrl ? getPrizeLogo(imageUrl) : null;
  const companyName = display.provider || sponsorName?.trim();
  const hasQuantity = typeof originalQuantity === "number" && Number.isInteger(originalQuantity) && originalQuantity >= 0;

  return (
    <Card className={`${styles["prize-card"]} flex h-full w-full flex-col overflow-hidden ${compact ? styles["prize-card-compact"] : ""} `}>
      <div className={styles["prize-card-heading"]}>
        <h3 className={styles["prize-card-title"]}>{display.title}</h3>
        {companyName && <p className={styles["prize-card-provider"]}>{companyName}</p>}
      </div>

      <div className={styles["prize-card-artwork"]} style={logo ? { background: logo.background } : undefined}>
        {hasQuantity && <span className={styles["carousel-count"]}>{originalQuantity.toLocaleString()} {originalQuantity === 1 ? "prize" : "prizes"}</span>}
        {logo ? (
          <div className="flex h-full w-full items-center justify-center" style={{ padding: logo.padding }}>
            <img src={logo.src} alt={display.provider ? `${display.provider} logo` : name}
              loading="lazy" decoding="async" className="h-full w-full object-contain" style={{ maxWidth: logo.maxWidth }} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F0F4FB] to-[#FBF6E8]">
            <div className={`${styles["prize-card-gift"]} flex h-16 w-16 items-center justify-center rounded-2xl border border-white bg-white/80 text-[#AD8D45] shadow-sm`}>
              <Gift className="h-8 w-8" strokeWidth={1.4} aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {children}
    </Card>
  );
}
