import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast, Toaster } from "sonner";
import { getStyle, saveStyle, deleteStyle } from "@/lib/catalog/api";
import { compressImage } from "@/lib/catalog/image";
import { CATS, SEASONS, type Style } from "@/lib/catalog/types";
import { useDesk } from "@/lib/catalog/store";

const blank: Style = {
  code: "",
  aliases: [],
  colors: [],
  sizeRange: "",
  price: null,
  composition: "",
  weight: "",
  standard: "",
  safety: "",
  note: "",
  memo: "",
  category: "上衣",
  photo: "",
  season: "26冬",
  listed: true,
};

export function StyleForm({ code }: { code: string }) {
  const isNew = code === "new";
  const nav = useNavigate();
  const desk = useDesk();
  const [form, setForm] = useState<Style>(blank);
  const [colorText, setColorText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(isNew);

  useEffect(() => {
    if (isNew) return;
    void getStyle({ data: { code } }).then((s) => {
      if (!s) {
        toast.error("没有这款");
        void nav({ to: "/" });
        return;
      }
      setForm(s);
      setColorText(s.colors.join("、"));
      setReady(true);
    });
  }, [code, isNew, nav]);

  function set<K extends keyof Style>(k: K, v: Style[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onPhoto(file: File) {
    const photo = await compressImage(file);
    set("photo", photo);
  }

  async function onSave() {
    const nextCode = form.code.trim();
    if (!nextCode) {
      toast.error("先填款号");
      return;
    }
    const colors = colorText
      .split(/[、,，\n]/)
      .map((c) => c.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      await saveStyle({
        data: {
          ...form,
          code: nextCode,
          aliases: form.aliases.length ? form.aliases : [nextCode],
          colors,
          isNew,
        },
      });
      toast.success(isNew ? "已上新，全员可见" : "已保存，全员同步");
      if (isNew) void nav({ to: "/style/$code", params: { code: nextCode } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function addToQuote(color: string) {
    desk.addColors({ ...form, colors: form.colors.length ? form.colors : [color] }, [color]);
    toast.success(`已加入 ${form.code} · ${color}`);
  }

  async function onToggleList() {
    const next = { ...form, listed: !form.listed };
    setForm(next);
    setBusy(true);
    try {
      await saveStyle({
        data: {
          ...next,
          aliases: next.aliases.length ? next.aliases : [next.code],
          colors: colorText.split(/[、,，\n]/).map((c) => c.trim()).filter(Boolean),
          isNew: false,
        },
      });
      toast.success(next.listed ? "已上架" : "已下架，文字选款里看不到");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
      setForm(form);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`确定删除 ${form.code}？全员都会看不到这款，不可恢复。`)) return;
    setBusy(true);
    try {
      await deleteStyle({ data: { code: form.code } });
      toast.success("已删除");
      void nav({ to: "/all" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="p-8 text-center text-sm text-muted">读取档案…</p>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Toaster position="top-center" richColors />
      <header className="bg-pine text-canvas">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/all" className="text-sm text-canvas/80">
            ← 图片选款
          </Link>
          <p className="font-display text-lg">{isNew ? "上新" : form.code}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSave()}
            className="min-h-11 rounded-lg bg-gold px-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {busy ? "保存中…" : "保存"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-3xl gap-4 px-4 py-4 sm:grid-cols-[200px_1fr]">
        <section className="rounded-xl border border-line bg-white p-3">
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-canvas">
            {form.photo ? (
              <img src={form.photo} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-muted">还没有图</span>
            )}
          </div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-pine text-sm text-canvas">
            上传主图
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-line bg-white p-4">
          <Field label="款号">
            <input
              value={form.code}
              disabled={!isNew}
              onChange={(e) => set("code", e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm disabled:opacity-70"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="季节">
              <select
                value={form.season}
                onChange={(e) => set("season", e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              >
                {SEASONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="分类">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              >
                {CATS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="不含税打包价">
              <input
                type="number"
                min={0}
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              />
            </Field>
            <Field label="尺码段">
              <input
                value={form.sizeRange}
                onChange={(e) => set("sizeRange", e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="颜色（顿号或逗号分开）">
            <input
              value={colorText}
              onChange={(e) => setColorText(e.target.value)}
              placeholder="云上舞白、黑色"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </Field>
          {!isNew && form.colors.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-muted">加入报价（点一个加一色）</p>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addToQuote(c)}
                    className="min-h-11 rounded-lg bg-canvas px-3 text-sm"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="成分">
            <textarea
              value={form.composition}
              onChange={(e) => set("composition", e.target.value)}
              className="min-h-20 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="克重">
              <input
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              />
            </Field>
            <Field label="执行标准">
              <input
                value={form.standard}
                onChange={(e) => set("standard", e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="安全类别">
            <input
              value={form.safety}
              onChange={(e) => set("safety", e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </Field>
          <Field label="备注">
            <input
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </Field>
          <Field label="内部备忘">
            <textarea
              value={form.memo}
              onChange={(e) => set("memo", e.target.value)}
              placeholder="全员可见，出表单独一列"
              className="min-h-20 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </Field>
          {!isNew && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onToggleList()}
                className="min-h-11 rounded-lg border border-line px-3 text-sm"
              >
                {form.listed ? "下架" : "重新上架"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete()}
                className="min-h-11 rounded-lg border border-warn px-3 text-sm text-warn"
              >
                删除这款
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
