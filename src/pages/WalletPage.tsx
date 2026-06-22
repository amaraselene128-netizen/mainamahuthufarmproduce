import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Wallet, ArrowDownCircle } from "lucide-react";

function WalletPage() {
  const { user } = useAuth();
  const [w, setW] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

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
    const n = Number(amount);
    if (!n || n < 10) return toast.error("Minimum withdrawal is $10");
    if (n > Number(w?.available ?? 0)) return toast.error("Insufficient available balance");
    setLoading(true);
    const { error } = await db.from("withdrawal_requests").insert({ user_id: user.id, amount: n, method, details: { account: details } });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal requested — payouts on the 28th");
    setAmount(""); setDetails("");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Available" value={`$${Number(w?.available ?? 0).toFixed(2)}`} />
        <Card label="Pending" value={`$${Number(w?.pending ?? 0).toFixed(2)}`} />
        <Card label="Total earned" value={`$${Number(w?.total_earned ?? 0).toFixed(2)}`} />
        <Card label="Total withdrawn" value={`$${Number(w?.total_withdrawn ?? 0).toFixed(2)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={withdraw} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2"><ArrowDownCircle className="size-5 text-primary" /><h2 className="font-display text-xl">Request withdrawal</h2></div>
          <label className="block"><span className="text-sm font-medium">Amount (USD)</span><input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="10" className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm" /></label>
          <label className="block"><span className="text-sm font-medium">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
              <option value="paypal">PayPal</option>
              <option value="mpesa">M-Pesa</option>
              <option value="wise">Wise</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <label className="block"><span className="text-sm font-medium">Account details</span><input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="PayPal email, M-Pesa number, wallet address…" className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm" /></label>
          <button disabled={loading} className="rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">{loading ? "Submitting…" : "Submit request"}</button>
          <p className="text-xs text-muted-foreground">Payments processed monthly on the 28th after admin approval.</p>
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
