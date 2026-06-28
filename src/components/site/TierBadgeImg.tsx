import bronze from "@/assets/tiers/bronze.png";
import silver from "@/assets/tiers/silver.png";
import gold from "@/assets/tiers/gold.png";

export type TierName = "bronze" | "silver" | "gold";

const MAP: Record<TierName, string> = { bronze, silver, gold };

export function TierBadgeImg({
  tier,
  size = 28,
  className = "",
  title,
}: {
  tier: TierName | null | undefined;
  size?: number;
  className?: string;
  title?: string;
}) {
  if (!tier) return null;
  return (
    <img
      src={MAP[tier]}
      alt={`${tier} tier`}
      title={title ?? `${tier.toUpperCase()} tier`}
      width={size}
      height={size}
      className={`inline-block object-contain drop-shadow ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
