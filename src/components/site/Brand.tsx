export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-8 rounded-lg bg-gradient-gold shadow-glow grid place-items-center">
        <span className="font-display text-lg font-bold text-primary-foreground">E</span>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-secondary ring-2 ring-background" />
      </div>
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight">
          EGRA<span className="text-gradient-gold">TASKS</span>
        </span>
      )}
    </div>
  );
}
