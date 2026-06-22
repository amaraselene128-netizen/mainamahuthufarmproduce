import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

function Countries() {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    const { data } = await db.from("countries").select("*").order("name");
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function toggle(code: string, restricted: boolean) {
    const { error } = await db.from("countries").update({ restricted }).eq("code", code);
    if (error) return toast.error(error.message);
    setRows((arr) => arr.map((r) => (r.code === code ? { ...r, restricted } : r)));
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Country restrictions</h1>
      <p className="text-sm text-muted-foreground">Restricted countries see: "Registrations from your country are currently unavailable."</p>
      <div className="rounded-2xl border hairline bg-card divide-y divide-border">
        {rows.map((r) => (
          <div key={r.code} className="p-3 flex items-center justify-between">
            <div><span className="font-medium">{r.name}</span> <span className="text-xs text-muted-foreground ml-2">{r.code}</span></div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={r.restricted} onChange={(e) => toggle(r.code, e.target.checked)} />
              <span>Restricted</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Countries;
