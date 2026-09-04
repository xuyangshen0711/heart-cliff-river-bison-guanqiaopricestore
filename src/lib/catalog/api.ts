import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import seedFile from "./seed.json";
import type { Style } from "./types";

type StyleRow = {
  code: string;
  aliases: unknown;
  colors: unknown;
  size_range: string;
  price: number | string | null;
  composition: string;
  weight: string;
  standard: string;
  safety: string;
  note: string;
  memo: string;
  category: string;
  season: string;
  photo: string;
  listed: boolean;
};

type CatalogSql = {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function rowToStyle(r: StyleRow): Style {
  return {
    code: r.code,
    aliases: asStringArray(r.aliases),
    colors: asStringArray(r.colors),
    sizeRange: r.size_range ?? "",
    price: r.price == null || r.price === "" ? null : Number(r.price),
    composition: r.composition ?? "",
    weight: r.weight ?? "",
    standard: r.standard ?? "",
    safety: r.safety ?? "",
    note: r.note ?? "",
    memo: r.memo ?? "",
    category: r.category ?? "上衣",
    season: r.season ?? "26冬",
    photo: r.photo ?? "",
    listed: r.listed !== false,
  };
}

async function backfillSeedPhotos(sql: CatalogSql, styles: Style[]) {
  for (const s of styles) {
    if (!s.photo) continue;
    await sql.query(
      "update styles set photo = $2 where code = $1 and (photo is null or photo = '')",
      [s.code, s.photo],
    );
  }
}

async function ensureSeeded() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const styles = (seedFile as unknown as { styles: Style[] }).styles;
  const count = await sql<{ n: number }>`select count(*)::int as n from styles`;
  if ((count[0]?.n ?? 0) > 0) {
    await backfillSeedPhotos(sql, styles);
    return;
  }
  for (const s of styles) {
    await sql.query(
      `insert into styles
        (code, aliases, colors, size_range, price, composition, weight, standard, safety, note, memo, category, season, photo, listed)
       values ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
       on conflict (code) do nothing`,
      [
        s.code,
        JSON.stringify(s.aliases ?? [s.code]),
        JSON.stringify(s.colors ?? []),
        s.sizeRange ?? "",
        s.price,
        s.composition ?? "",
        s.weight ?? "",
        s.standard ?? "",
        s.safety ?? "",
        s.note ?? "",
        s.memo ?? "",
        s.category ?? "上衣",
        s.season ?? "26冬",
        s.photo ?? "",
      ],
    );
  }
}

export const listStyles = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<StyleRow>`
    select code, aliases, colors, size_range, price, composition, weight, standard, safety, note, memo, category, season, photo, listed
    from styles
    order by season desc, category, code
  `;
  return rows.map(rowToStyle);
});

export const getStyle = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<StyleRow>`
      select code, aliases, colors, size_range, price, composition, weight, standard, safety, note, memo, category, season, photo, listed
      from styles where code = ${data.code}
      limit 1
    `;
    return rows[0] ? rowToStyle(rows[0]) : null;
  });

const styleInput = z.object({
  code: z.string().min(1).max(40),
  aliases: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  sizeRange: z.string().default(""),
  price: z.number().nullable().optional(),
  composition: z.string().default(""),
  weight: z.string().default(""),
  standard: z.string().default(""),
  safety: z.string().default(""),
  note: z.string().default(""),
  memo: z.string().default(""),
  category: z.string().default("上衣"),
  season: z.string().default("26冬"),
  photo: z.string().default(""),
  listed: z.boolean().default(true),
  isNew: z.boolean().optional(),
});

export const saveStyle = createServerFn({ method: "POST" })
  .validator((d: unknown) => styleInput.parse(d))
  .handler(async ({ data }) => {
    const code = data.code.trim();
    const aliases = data.aliases.length ? data.aliases : [code];
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.isNew) {
      const exists = await sql<{ n: number }>`select count(*)::int as n from styles where code = ${code}`;
      if ((exists[0]?.n ?? 0) > 0) throw new Error(`款号 ${code} 已存在`);
      await sql.query(
        `insert into styles
          (code, aliases, colors, size_range, price, composition, weight, standard, safety, note, memo, category, season, photo, listed, updated_at)
         values ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())`,
        [
          code,
          JSON.stringify(aliases),
          JSON.stringify(data.colors.filter(Boolean)),
          data.sizeRange,
          data.price ?? null,
          data.composition,
          data.weight,
          data.standard,
          data.safety,
          data.note,
          data.memo,
          data.category,
          data.season,
          data.photo,
          data.listed,
        ],
      );
    } else {
      await sql.query(
        `update styles set
          aliases = $2::jsonb,
          colors = $3::jsonb,
          size_range = $4,
          price = $5,
          composition = $6,
          weight = $7,
          standard = $8,
          safety = $9,
          note = $10,
          memo = $11,
          category = $12,
          season = $13,
          photo = coalesce(nullif($14, ''), photo),
          listed = $15,
          updated_at = now()
         where code = $1`,
        [
          code,
          JSON.stringify(aliases),
          JSON.stringify(data.colors.filter(Boolean)),
          data.sizeRange,
          data.price ?? null,
          data.composition,
          data.weight,
          data.standard,
          data.safety,
          data.note,
          data.memo,
          data.category,
          data.season,
          data.photo,
          data.listed,
        ],
      );
    }
    return { ok: true, code };
  });

export const deleteStyle = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(`delete from styles where code = $1`, [data.code]);
    return { ok: true };
  });
