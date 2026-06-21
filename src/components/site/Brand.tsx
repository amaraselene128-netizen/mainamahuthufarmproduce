import logo from "@/assets/egratasks-logo.png.asset.json";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo.url}
        alt="EGRATASKS"
        width={compact ? 32 : 160}
        height={compact ? 32 : 40}
        className={compact ? "size-8 object-contain" : "h-10 w-auto object-contain"}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
