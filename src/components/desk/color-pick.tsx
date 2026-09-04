import { useState } from "react";
import type { Style } from "@/lib/catalog/types";

export function ColorPick({
  style,
  onConfirm,
  onClose,
}: {
  style: Style;
  onConfirm: (colors: string[]) => void;
  onClose: () => void;
}) {
  const colors = style.colors.length ? style.colors : ["默认"];
  const [sel, setSel] = useState<string[]>([]);

  function toggle(c: string) {
    setSel((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
        <p className="font-display text-lg text-pine">{style.code}</p>
        <p className="text-xs text-muted">选要加入报价的颜色，不会一次加全色</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((c) => {
            const on = sel.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={
                  "min-h-11 rounded-lg px-3 text-sm " +
                  (on ? "bg-pine text-canvas" : "bg-canvas text-ink")
                }
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-lg bg-canvas text-sm"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            disabled={!sel.length}
            className="min-h-11 flex-1 rounded-lg bg-gold text-sm font-semibold text-ink disabled:opacity-40"
            onClick={() => onConfirm(sel)}
          >
            加入 {sel.length} 色
          </button>
        </div>
      </div>
    </div>
  );
}
