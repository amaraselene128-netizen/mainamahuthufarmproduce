import logo from "@/assets/egmtasks-logo.png";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo}
        alt="EGMTASKS"
        width={compact ? 32 : 720}
        height={compact ? 32 : 180}
        className={compact ? "size-8 object-contain" : "h-[180px] w-auto object-contain"}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
