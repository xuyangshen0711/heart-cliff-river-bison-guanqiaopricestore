import { Link } from "@tanstack/react-router";

const navClass =
  "inline-flex min-h-11 items-center rounded-lg border border-canvas/30 px-3 text-sm";
const navActive = "bg-canvas/15 font-semibold";

export function DeskHeader({
  catalogCount,
  busy,
  onExport,
}: {
  catalogCount?: number;
  busy?: boolean;
  onExport?: () => void;
}) {
  return (
    <header className="bg-pine text-canvas">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-wide">冠乔 报价资料库</p>
          <p className="text-xs text-canvas/75">
            {catalogCount != null ? `共用款式库 · ${catalogCount} 款` : "共用款式库"}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link to="/" activeOptions={{ exact: true }} className={navClass} activeProps={{ className: navActive }}>
            文字选款
          </Link>
          <Link to="/all" className={navClass} activeProps={{ className: navActive }}>
            图片选款
          </Link>
          <Link
            to="/style/$code"
            params={{ code: "new" }}
            className={navClass}
            activeProps={{ className: navActive }}
          >
            上新
          </Link>
          {onExport && (
            <button
              type="button"
              className="min-h-11 rounded-lg bg-gold px-3 text-sm font-semibold text-ink disabled:opacity-50"
              disabled={busy}
              onClick={onExport}
            >
              {busy ? "处理中…" : "直接出表"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}