import { useState } from "react";
import { toast } from "sonner";
import { exportByTemplate, type QuoteTemplate } from "@/lib/catalog/export-quote";
import { useDesk } from "@/lib/catalog/store";

export function useQuoteExport() {
  const desk = useDesk();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  function requestExport() {
    if (!desk.draft.length) {
      toast.error("先点颜色加入草稿");
      return;
    }
    setOpen(true);
  }

  async function onExport(template: QuoteTemplate) {
    if (!desk.draft.length) {
      toast.error("先点颜色加入草稿");
      return;
    }
    setBusy(true);
    setOpen(false);
    try {
      await exportByTemplate({ template, customer: desk.customer, lines: desk.draft });
      toast.success(template === "nangua" ? "南瓜谷报价资料表已下载" : "冠乔客户报价资料表已下载");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导出失败");
    } finally {
      setBusy(false);
    }
  }

  return { busy, open, setOpen, requestExport, onExport };
}

export function ExportDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: QuoteTemplate) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-4">
        <p className="font-display text-lg text-pine">出哪套表</p>
        <p className="text-xs text-muted">选完下载。日期、单号、货品来源下载后再改。</p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="min-h-14 rounded-xl bg-pine px-3 text-left text-sm text-canvas"
            onClick={() => onPick("qixu")}
          >
            冠乔 客户报价资料表
            <span className="mt-0.5 block text-xs text-canvas/70">大多数客户用这一套</span>
          </button>
          <button
            type="button"
            className="min-h-14 rounded-xl border border-line px-3 text-left text-sm"
            onClick={() => onPick("nangua")}
          >
            南瓜谷 报价资料表
            <span className="mt-0.5 block text-xs text-muted">寄样 / 工厂登记</span>
          </button>
        </div>
        <button type="button" className="mt-3 min-h-11 w-full text-sm text-muted" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}