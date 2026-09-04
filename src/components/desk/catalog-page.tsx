import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast, Toaster } from "sonner";
import { listStyles } from "@/lib/catalog/api";
import { useDesk } from "@/lib/catalog/store";
import type { Style } from "@/lib/catalog/types";
import { ColorPick } from "./color-pick";
import { DeskHeader } from "./desk-header";
import { DraftPanel } from "./draft-panel";
import { ExportDialog, useQuoteExport } from "./export-dialog";

type SeasonFilter = "all" | "26秋" | "26冬";

export function CatalogPage() {
  const desk = useDesk();
  const [catalog, setCatalog] = useState<Style[]>([]);
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [pick, setPick] = useState<Style | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const exp = useQuoteExport();

  useEffect(() => {
    desk.hydrate();
    void listStyles().then(setCatalog).catch((e) => toast.error(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const base = showHidden ? catalog : catalog.filter((s) => s.listed);
    return season === "all" ? base : base.filter((s) => s.season === season);
  }, [catalog, season, showHidden]);

  const groups = useMemo(() => groupStyles(visible), [visible]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Toaster position="top-center" richColors />
      {pick && (
        <ColorPick
          style={pick}
          onClose={() => setPick(null)}
          onConfirm={(colors) => {
            desk.addColors(pick, colors);
            toast.success(`${pick.code} 加入 ${colors.length} 色`);
            setPick(null);
          }}
        />
      )}
      <ExportDialog open={exp.open} onClose={() => exp.setOpen(false)} onPick={(t) => void exp.onExport(t)} />
      <DeskHeader catalogCount={catalog.length} busy={exp.busy} onExport={exp.requestExport} />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4 flex gap-1 rounded-xl bg-canvas p-1">
            {(
              [
                ["all", "全部款式"],
                ["26秋", "26秋"],
                ["26冬", "26冬"],
              ] as const
            ).map(([id, label]) => (
              <TabBtn key={id} active={season === id} onClick={() => setSeason(id)}>
                {label}
              </TabBtn>
            ))}
          </div>
          <label className="mb-4 flex min-h-11 items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
            显示已下架
          </label>
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.title}>
                <h2 className="mb-3 font-display text-lg text-pine">{g.title}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {g.items.map((s) => (
                    <article key={s.code} className="overflow-hidden rounded-xl border border-line bg-white">
                      <Link
                        to="/style/$code"
                        params={{ code: s.code }}
                        className="flex h-40 w-full items-center justify-center bg-canvas"
                      >
                        {s.photo ? (
                          <img src={s.photo} alt={s.code} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs text-muted">无图 · 点进档案补</span>
                        )}
                      </Link>
                      <div className="p-2">
                        <p className="text-sm font-semibold">
                          {s.code}
                          {!s.listed && <span className="ml-1 text-xs font-normal text-warn">已下架</span>}
                        </p>
                        <p className="text-xs text-muted">
                          {s.price != null ? `打包价 ¥${s.price}` : "—"} · {s.colors.length} 色
                        </p>
                        <button
                          type="button"
                          className="mt-1 min-h-11 w-full rounded-md border border-line text-xs"
                          onClick={() => setPick(s)}
                        >
                          选颜色加入报价
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <DraftPanel />
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium " +
        (active ? "bg-white text-pine shadow-sm" : "text-muted")
      }
    >
      {children}
    </button>
  );
}

const CAT_ORDER = ["上衣", "套装", "马甲", "裙装", "内搭", "裤子"];

function groupStyles(styles: Style[]) {
  const seasons = ["26秋", "26冬"];
  const out: { title: string; items: Style[] }[] = [];
  for (const season of seasons) {
    const bucket = styles.filter((s) => s.season === season);
    const cats = Array.from(new Set(bucket.map((s) => s.category))).sort(
      (a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b),
    );
    for (const cat of cats) {
      const items = bucket.filter((s) => s.category === cat);
      if (items.length) out.push({ title: `${season} · ${cat} ${items.length}`, items });
    }
  }
  return out;
}