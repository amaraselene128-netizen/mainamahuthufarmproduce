import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import type { ReactNode } from "react";

export function StaticShell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">{title}</h1>
          {sub && <p className="mt-4 text-lg text-muted-foreground">{sub}</p>}
          <div className="prose prose-neutral max-w-none mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_a]:text-primary">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}