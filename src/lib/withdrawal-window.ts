// Withdrawal window: open from the 28th of every month through the 5th of the next month (inclusive).
// During this window, approved earnings are paid out instantly.

export function isWithdrawalOpen(now: Date = new Date()): boolean {
  const day = now.getDate();
  return day >= 28 || day <= 5;
}

export function windowStatus(now: Date = new Date()): {
  open: boolean;
  opensAt: Date;
  closesAt: Date;
  label: string;
} {
  const open = isWithdrawalOpen(now);
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = now.getDate();

  let opensAt: Date;
  let closesAt: Date;

  if (open) {
    // window opened on 28th of either this month or last month
    if (day >= 28) {
      opensAt = new Date(y, m, 28);
      closesAt = new Date(y, m + 1, 5, 23, 59, 59);
    } else {
      opensAt = new Date(y, m - 1, 28);
      closesAt = new Date(y, m, 5, 23, 59, 59);
    }
  } else {
    opensAt = new Date(y, m, 28);
    closesAt = new Date(y, m + 1, 5, 23, 59, 59);
  }

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const label = open
    ? `Open · closes ${fmt(closesAt)}`
    : `Closed · opens ${fmt(opensAt)}`;

  return { open, opensAt, closesAt, label };
}
