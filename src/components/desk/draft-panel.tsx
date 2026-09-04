import { useDesk } from "@/lib/catalog/store";

export function DraftPanel() {
  const desk = useDesk();
  const money = desk.draft.reduce((a, b) => a + b.price * b.qty, 0);
  const qty = desk.draft.reduce((a, b) => a + b.qty, 0);
  const styleCount = new Set(desk.draft.map((d) => d.code)).size;

  return (
    <aside className="rounded-xl border border-line bg-white p-4 lg:sticky lg:top-3 lg:self-start">
      <p className="text-xs text-muted">报价草稿 · 单价可改</p>
      {desk.draft.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">还没有草稿。</p>
      ) : (
        <ul className="divide-y divide-line">
          {desk.draft.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2">
              {d.photo ? (
                <img src={d.photo} alt="" className="h-16 w-12 rounded-md bg-canvas object-contain" />
              ) : (
                <div className="h-16 w-12 rounded-md bg-canvas" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {d.code} · {d.color}
                </p>
              </div>
              <label className="text-[10px] text-muted">
                单价
                <input
                  type="number"
                  min={0}
                  value={d.price}
                  onChange={(e) => desk.setPrice(d.id, Number(e.target.value))}
                  className="w-16 rounded-md border border-line px-2 py-1 text-sm text-ink"
                />
              </label>
              <label className="text-[10px] text-muted">
                件
                <input
                  type="number"
                  min={1}
                  value={d.qty}
                  onChange={(e) => desk.setQty(d.id, Number(e.target.value))}
                  className="w-14 rounded-md border border-line px-2 py-1 text-sm text-ink"
                />
              </label>
              <button type="button" className="text-xs text-warn" onClick={() => desk.removeLine(d.id)}>
                删
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between text-sm font-semibold">
        <span>
          {styleCount} 款 · {desk.draft.length} 个色 · {qty} 件
        </span>
        <span>¥{money}</span>
      </div>
      <button type="button" className="mt-3 text-xs text-warn" onClick={() => desk.clearDraft()}>
        清空草稿
      </button>
    </aside>
  );
}