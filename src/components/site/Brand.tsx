import logo from "@/assets/egmtasks-logo.png";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo}
        alt="EGMTASKS"
        width={compact ? 32 : 200}
        height={compact ? 32 : 48}
        className={compact ? "size-8 object-contain" : "h-10 sm:h-11 w-auto object-contain"}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
