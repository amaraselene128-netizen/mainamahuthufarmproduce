// Withdrawal window: open from the 1st through the 5th of every month (inclusive).
// Approved earnings settle on the 5th of each month.

export function isWithdrawalOpen(now: Date = new Date()): boolean {
  const day = now.getDate();
  return day >= 1 && day <= 5;
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
    opensAt = new Date(y, m, 1);
    closesAt = new Date(y, m, 5, 23, 59, 59);
  } else if (day < 1) {
    opensAt = new Date(y, m, 1);
    closesAt = new Date(y, m, 5, 23, 59, 59);
  } else {
    // after the 5th — next window is the 1st of next month
    opensAt = new Date(y, m + 1, 1);
    closesAt = new Date(y, m + 1, 5, 23, 59, 59);
  }

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const label = open
    ? `Open · closes ${fmt(closesAt)}`
    : `Closed · opens ${fmt(opensAt)}`;

  return { open, opensAt, closesAt, label };
}
