import logo from "@/assets/egratasks-logo.png.asset.json";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo.url}
        alt="EGRATASKS"
        width={compact ? 32 : 720}
        height={compact ? 32 : 180}
        className={compact ? "size-8 object-contain" : "h-[180px] w-auto object-contain"}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
