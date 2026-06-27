import logo from "@/assets/egmtasks-logo.png";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo}
        alt="EGMTASKS"
        width={compact ? 64 : 400}
        height={compact ? 64 : 96}
        className={
          compact
            ? "size-16 object-contain"
            : "h-20 sm:h-22 w-auto object-contain"
        }
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
