import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

/**
 * Subscribes to inserts on public.notifications for the current user and
 * shows a toast. Mounted once inside DashLayout/AdminLayout.
 */
export function NotificationToaster() {
  const { user } = useAuth();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const channel = db
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; title?: string; body?: string };
          if (!row?.id || seen.current.has(row.id)) return;
          seen.current.add(row.id);
          toast(row.title ?? "Notification", {
            description: row.body ?? undefined,
            icon: <Bell className="size-4 text-primary" />,
          });
        },
      )
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user?.id]);

  return null;
}
