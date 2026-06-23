import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Wallet, ArrowDownCircle, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { isWithdrawalOpen, windowStatus } from "@/lib/withdrawal-window";

function WalletPage() {
  const { user } = useAuth();
  const [w, setW] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mpesa");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const winStatus = windowStatus();
  const open = winStatus.open;
  const numericAmount = Number(amount);
  const insufficient = numericAmount > Number(w?.available ?? 0);
  const tooLow = !numericAmount || numericAmount < 10;
  const noDetails = !details.trim();
  const submitDisabled = loading || !open || insufficient || tooLow || noDetails;

  async function load() {
    if (!user) return;
    const [wRes, tRes, rRes] = await Promise.all([
      db.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
      db.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      db.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setW(wRes.data); setTx(tRes.data ?? []); setReqs(rRes.data ?? []);
  }
  useEffect(() => { load(); }, [user]);

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!open) return toast.error("Withdrawals are closed. Window: 1st — 5th of every month.");
    if (tooLow) return toast.error("Minimum withdrawal is $10");
    if (insufficient) return toast.error("Insufficient available balance");

    setLoading(true);
    const { data, error } = await db.functions.invoke("request-withdrawal", {
      body: { amount: numericAmount, method, details: { account: details } },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      return toast.error(error?.message ?? (data as any).error);
    }
    toast.success("Paid instantly to your account 🎉");
    setAmount(""); setDetails("");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Wallet</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          open ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
        }`}>
          {open ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
          Withdrawals · {winStatus.label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Available" value={`$${Number(w?.available ?? 0).toFixed(2)}`} />
        <Card label="Pending" value={`$${Number(w?.pending ?? 0).toFixed(2)}`} />
        <Card label="Total earned" value={`$${Number(w?.total_earned ?? 0).toFixed(2)}`} />
        <Card label="Total withdrawn" value={`$${Number(w?.total_withdrawn ?? 0).toFixed(2)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={withdraw} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="size-5 text-primary" />
            <h2 className="font-display text-xl">Request withdrawal</h2>
          </div>

          {!open && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 text-amber-500 shrink-0" />
              <span>
                Payouts are open <strong>1st — 5th</strong> of each month. {winStatus.label}.
                During the window, withdrawals are instant.
              </span>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium">Amount (USD)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number" step="0.01" min="10"
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            />
            {amount && insufficient && (
              <span className="text-xs text-destructive mt-1 block">
                Exceeds available balance (${Number(w?.available ?? 0).toFixed(2)})
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
              <option value="mpesa">M-Pesa</option>
              <option value="paypal">PayPal</option>
              <option value="wise">Wise</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Account details</span>
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="M-Pesa number, PayPal email, wallet address…"
              className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            />
          </label>
          <button
            disabled={submitDisabled}
            className="w-full rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing…" :
              !open ? "Withdrawals closed" :
              tooLow ? "Enter at least $10" :
              insufficient ? "Insufficient balance" :
              noDetails ? "Enter account details" :
              `Withdraw $${numericAmount.toFixed(2)} instantly`}
          </button>
          <p className="text-xs text-muted-foreground">
            Inside the 1st → 5th window, payouts settle instantly. Outside it, the system is closed.
          </p>
        </form>

        <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
          <h2 className="font-display text-xl mb-3 flex items-center gap-2"><Wallet className="size-5 text-primary" /> Recent transactions</h2>
          <div className="divide-y divide-border text-sm">
            {tx.length === 0 && <p className="text-muted-foreground py-4">No transactions yet.</p>}
            {tx.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium capitalize">{t.type.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <span className={Number(t.amount) >= 0 ? "text-secondary font-semibold" : "text-destructive font-semibold"}>
                  {Number(t.amount) >= 0 ? "+" : ""}${Number(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border hairline bg-card p-6 shadow-card">
        <h2 className="font-display text-xl mb-3">Withdrawal history</h2>
        <div className="divide-y divide-border text-sm">
          {reqs.length === 0 && <p className="text-muted-foreground py-4">No requests yet.</p>}
          {reqs.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">${Number(r.amount).toFixed(2)} · {r.method}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                r.status === "paid" ? "bg-secondary/15 text-secondary" :
                r.status === "approved" ? "bg-primary/15 text-primary" :
                r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                "bg-muted text-foreground"}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border hairline bg-card p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1 text-gradient-gold">{value}</div>
    </div>
  );
}

export default WalletPage;
