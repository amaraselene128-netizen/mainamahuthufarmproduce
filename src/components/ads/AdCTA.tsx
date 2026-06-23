import { ExternalLink, X } from "lucide-react";
import { db } from "@/lib/db";

type Props = {
  adId: string;
  userId: string;
  destinationUrl: string;
  buttonText: string;
  onClose: () => void;
};

export function AdCTA({ adId, userId, destinationUrl, buttonText, onClose }: Props) {
  async function go() {
    try {
      await db.from("ad_clicks").insert({
        ad_id: adId, user_id: userId, destination_url: destinationUrl,
      });
    } catch {}
    window.open(destinationUrl, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card border hairline shadow-luxe p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold">Enjoying this?</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Tap below to open the advertiser's destination. You can also continue without installing —
          your reward is already credited.
        </p>
        <button
          onClick={go}
          className="w-full rounded-xl bg-gradient-gold px-4 py-3 text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-2"
        >
          {buttonText} <ExternalLink className="size-4" />
        </button>
        <button onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">
          Continue without installing
        </button>
      </div>
    </div>
  );
}
