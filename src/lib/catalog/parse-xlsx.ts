import type { Style } from "./types";
import { extractAliases } from "./match";

function headerIndex(headers: string[], names: string[]) {
  for (const n of names) {
    const i = headers.findIndex((h) => h.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

function isDispImg(v: unknown) {
  const s = String(v ?? "");
  return s.includes("DISPIMG");
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function categoryOf(code: string, sheet: string) {
  if (sheet.includes("裤")) return "裤子";
  const u = code.toUpperCase();
  if (u.endsWith("TQ")) return "套装";
  if (u.endsWith("K")) return "裤子";
  if (u.endsWith("Q")) return "裙装";
  if (u.endsWith("J")) return "马甲";
  if (u.endsWith("T")) return "内搭";
  return "上衣";
}

function seasonOf(code: string, sheet: string) {
  const blob = `${code}${sheet}`.toUpperCase();
  if (/886C|83K|秋/.test(blob)) return "26秋";
  if (/886D|85K|冬/.test(blob)) return "26冬";
  return "";
}

function fixCode(raw: string): { code: string; aliases: string[] } {
  const aliases = extractAliases(raw);
  let code = aliases[0] || raw;
  if (code === "886116TQ") {
    aliases.push("886C116TQ");
    code = "886C116TQ";
  }
  return { code, aliases: Array.from(new Set(aliases)) };
}

export async function parseCatalogXlsx(file: File): Promise<Style[]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());

  const styles: Style[] = [];

  for (const ws of wb.worksheets) {
    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, col) => {
      headers[col] = String(cell.value ?? "").trim();
    });
    const cCode = headerIndex(headers, ["款号", "款式"]);
    const cColor = headerIndex(headers, ["颜色"]);
    const cSize = headerIndex(headers, ["尺码"]);
    const cPrice = headerIndex(headers, ["单价", "打包价"]);
    const cComp = headerIndex(headers, ["成份", "成分"]);
    const cWeight = headerIndex(headers, ["克重"]);
    const cStd = headerIndex(headers, ["执行标准"]);
    const cSafe = headerIndex(headers, ["安全"]);
    const cNote = headerIndex(headers, ["含棉", "备注", "卖点"]);
    if (cCode < 0) continue;

    let current: Style | null = null;

    ws.eachRow((row, rn) => {
      if (rn === 1) return;
      const codeCell = row.getCell(cCode);
      const rawCode = isDispImg(codeCell.value) ? "" : String(codeCell.value ?? "").trim();
      const isMaster =
        rawCode.length > 0 &&
        (!codeCell.isMerged ||
          !codeCell.master ||
          codeCell.master.address === codeCell.address);

      const color = cColor > 0 ? String(row.getCell(cColor).value ?? "").trim() : "";

      if (isMaster) {
        const { code, aliases } = fixCode(rawCode);
        const weightVal = cWeight > 0 ? row.getCell(cWeight).value : "";
        current = {
          code,
          aliases,
          colors: [],
          sizeRange: cSize > 0 ? String(row.getCell(cSize).value ?? "").trim() : "",
          price: cPrice > 0 ? num(row.getCell(cPrice).value) : null,
          composition: cComp > 0 ? String(row.getCell(cComp).value ?? "").trim() : "",
          weight: isDispImg(weightVal) ? "" : String(weightVal ?? "").trim(),
          standard: cStd > 0 ? String(row.getCell(cStd).value ?? "").trim() : "",
          safety: cSafe > 0 ? String(row.getCell(cSafe).value ?? "").trim() : "",
          note: cNote > 0 ? String(row.getCell(cNote).value ?? "").trim() : "",
          memo: "",
          category: categoryOf(code, ws.name),
          photo: "",
          season: seasonOf(code, ws.name),
          listed: true,
        };
        styles.push(current);
      }
      if (current && color && !current.colors.includes(color)) {
        current.colors.push(color);
      }
    });
  }

  if (!styles.length) throw new Error("没有读到款号列，请确认是资料表 / 订单模板");
  return styles;
}
