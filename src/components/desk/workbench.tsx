import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast, Toaster } from "sonner";
import { listStyles } from "@/lib/catalog/api";
import { matchQuery } from "@/lib/catalog/match";
import { useDesk } from "@/lib/catalog/store";
import type { Style } from "@/lib/catalog/types";
import { DeskHeader } from "./desk-header";
import { DraftPanel } from "./draft-panel";
import { ExportDialog, useQuoteExport } from "./export-dialog";

export function Workbench() {
  const desk = useDesk();
  const [catalog, setCatalog] = useState<Style[]>([]);
  const exp = useQuoteExport();

  useEffect(() => {
    desk.hydrate();
    void listStyles().then(setCatalog).catch((e) => toast.error(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { hits, misses } = useMemo(
    () => matchQuery(catalog.filter((s) => s.listed), desk.query),
    [catalog, desk.query],
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Toaster position="top-center" richColors />
      <ExportDialog open={exp.open} onClose={() => exp.setOpen(false)} onPick={(t) => void exp.onExport(t)} />
      <DeskHeader catalogCount={catalog.length} busy={exp.busy} onExport={exp.requestExport} />

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-line bg-white p-4">
          <label className="text-xs text-muted">客户名称</label>
          <input
            value={desk.customer}
            onChange={(e) => desk.setCustomer(e.target.value)}
            className="mt-1 mb-3 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
          <label className="text-xs text-muted">客户看中的款号</label>
          <textarea
            value={desk.query}
            onChange={(e) => desk.setQuery(e.target.value)}
            placeholder={"打 886 会列出相关款，再多打几个字会收窄。也可以一行一个完整款号。"}
            className="mt-1 min-h-28 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
          <div className="mt-4 divide-y divide-line">
            {misses.map((m) => (
              <p key={m} className="py-2 text-sm text-warn">
                未找到：{m}
              </p>
            ))}
            {hits.map((s) => (
              <article key={s.code} className="grid grid-cols-[72px_1fr] gap-3 py-3">
                <Link to="/style/$code" params={{ code: s.code }}>
                  {s.photo ? (
                    <img
                      src={s.photo}
                      alt=""
                      className="h-[90px] w-[72px] rounded-md bg-canvas object-contain"
                    />
                  ) : (
                    <div className="flex h-[90px] w-[72px] items-center justify-center rounded-md bg-canvas text-xs text-muted">
                      无图
                    </div>
                  )}
                </Link>
                <div>
                  <p className="font-semibold">
                    {s.code}
                    {s.price != null && (
                      <span className="ml-2 text-xs font-normal text-muted">打包价 ¥{s.price}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{s.sizeRange}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          desk.addColors(s, [c]);
                          toast.success(`${s.code} · ${c}`);
                        }}
                        className="min-h-9 rounded-md bg-canvas px-2 py-1 text-xs"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
            {!desk.query.trim() && (
              <p className="py-8 text-center text-sm text-muted">打款号，点颜色加入草稿，再出表。</p>
            )}
          </div>
        </section>

        <DraftPanel />
      </div>
    </div>
  );
}