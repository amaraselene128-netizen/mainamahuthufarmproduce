import { useEffect, useState } from "react";
import { db, supabase } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Upload } from "lucide-react";

function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [countries, setCountries] = useState<any[]>([]);
  const [form, setForm] = useState({ full_name: "", username: "", bio: "", country_code: "", skills: "", twitter: "", linkedin: "", website: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.from("countries").select("code,name").order("name").then(({ data }) => setCountries(data ?? []));
  }, []);
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      username: profile.username,
      bio: profile.bio ?? "",
      country_code: profile.country_code ?? "",
      skills: profile.skills.join(", "),
      twitter: (profile.social_links as any)?.twitter ?? "",
      linkedin: (profile.social_links as any)?.linkedin ?? "",
      website: (profile.social_links as any)?.website ?? "",
    });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await db.from("profiles").update({
      full_name: form.full_name,
      username: form.username,
      bio: form.bio,
      country_code: form.country_code || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      social_links: { twitter: form.twitter, linkedin: form.linkedin, website: form.website },
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Profile updated");
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/avatar-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await db.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
    await refreshProfile();
    toast.success("Avatar updated");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>

      <div className="rounded-2xl border hairline bg-card p-6 shadow-card flex items-center gap-4">
        <div className="size-20 rounded-full bg-gradient-gold grid place-items-center overflow-hidden">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="size-20 object-cover" /> :
            <span className="font-display text-3xl text-primary-foreground">{profile?.username?.[0]?.toUpperCase()}</span>}
        </div>
        <div>
          <div className="font-medium">{profile?.username}</div>
          <div className="text-xs text-muted-foreground">{profile?.email}</div>
          <label htmlFor="avatar" className="mt-2 inline-flex items-center gap-1 text-xs cursor-pointer rounded-lg border border-input bg-card px-2 py-1 hover:bg-accent">
            <Upload className="size-3" /> Upload avatar
          </label>
          <input id="avatar" type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
        </div>
      </div>

      <form onSubmit={save} className="rounded-2xl border hairline bg-card p-6 shadow-card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <F label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Country</span>
            <select value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm">
              <option value="">—</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </label>
          <F label="Skills (comma separated)" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        </div>
        <label className="block"><span className="text-sm font-medium">Bio</span><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm" /></label>
        <div className="grid sm:grid-cols-3 gap-4">
          <F label="Twitter" value={form.twitter} onChange={(v) => setForm({ ...form, twitter: v })} />
          <F label="LinkedIn" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} />
          <F label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        </div>
        <button disabled={saving} className="rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:shadow-glow disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}

function F({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm" /></label>;
}

export default ProfilePage;
