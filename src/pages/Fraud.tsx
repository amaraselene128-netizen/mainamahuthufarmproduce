import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { ShieldAlert } from "lucide-react";

function Fraud() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    db.from("fraud_reports").select("*,profiles(username,email)").order("created_at", { ascending: false }).limit(100).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><ShieldAlert className="size-7 text-destructive" /> Fraud queue</h1>
      <p className="text-sm text-muted-foreground">Powered by the on-platform fraud detection signals. Action high/critical flags first.</p>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No flags. Nothing suspicious detected.</div>}
        {rows.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.profiles?.username ?? "—"} <span className="text-xs text-muted-foreground ml-2">{r.type}</span></div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.level === "critical" ? "bg-destructive text-destructive-foreground" : r.level === "high" ? "bg-destructive/15 text-destructive" : r.level === "medium" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>{r.level}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">score {r.score} · {new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Fraud;
