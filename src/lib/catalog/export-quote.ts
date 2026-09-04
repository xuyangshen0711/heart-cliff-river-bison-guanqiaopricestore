import type { DraftLine } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function safeFilePart(s: string) {
  return s.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "客户";
}

async function photoToBase64(src: string): Promise<string | null> {
  if (!src) return null;
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.86).split(",")[1];
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img"));
    img.src = src;
  });
}

export async function exportQuote(opts: { customer: string; lines: DraftLine[] }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("报价");
  const customer = opts.customer.trim() || "客户";

  ws.mergeCells("A1:R1");
  ws.getCell("A1").value = `冠乔客户报价资料表 · 客户：${customer}`;
  ws.getCell("A1").font = { bold: true, name: "微软雅黑", size: 14, color: { argb: "FF1F3D34" } };
  ws.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 26;

  ws.addRow([
    "图片",
    "款号",
    "颜色",
    "尺码段",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "件数",
    "不含税单价",
    "金额",
    "成份",
    "克重",
    "执行标准",
    "安全类别",
    "备注",
    "内部备忘",
  ]);
  ws.getRow(2).font = { bold: true, color: { argb: "FFF4EFE6" }, name: "微软雅黑", size: 10 };
  ws.getRow(2).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3D34" },
  };
  ws.columns = [
    { width: 14 },
    { width: 16 },
    { width: 12 },
    { width: 10 },
    { width: 6 },
    { width: 6 },
    { width: 6 },
    { width: 6 },
    { width: 6 },
    { width: 8 },
    { width: 12 },
    { width: 10 },
    { width: 42 },
    { width: 10 },
    { width: 18 },
    { width: 20 },
    { width: 22 },
    { width: 28 },
  ];

  type Group = { code: string; items: DraftLine[] };
  const groups: Group[] = [];
  for (const d of opts.lines) {
    const last = groups[groups.length - 1];
    if (!last || last.code !== d.code) groups.push({ code: d.code, items: [d] });
    else last.items.push(d);
  }

  let r = 3;
  for (const g of groups) {
    const start = r;
    const b64 = await photoToBase64(g.items[0]?.photo ?? "");
    let imgId: number | null = null;
    if (b64) imgId = wb.addImage({ base64: b64, extension: "jpeg" });
    for (let i = 0; i < g.items.length; i++) {
      const d = g.items[i];
      const qty = d.qty || 1;
      const price = d.price || 0;
      ws.addRow([
        "",
        i === 0 ? d.code : "",
        d.color,
        i === 0 ? d.sizeRange : "",
        "",
        "",
        "",
        "",
        "",
        qty,
        price,
        qty * price,
        i === 0 ? d.composition : "",
        i === 0 ? d.weight : "",
        i === 0 ? d.standard : "",
        i === 0 ? d.safety : "",
        i === 0 ? d.note : "",
        i === 0 ? d.memo || "" : "",
      ]);
      ws.getRow(r).height = 78;
      ws.getRow(r).alignment = { vertical: "middle", wrapText: true };
      r += 1;
    }
    if (imgId != null) {
      ws.addImage(imgId, {
        tl: { col: 0.15, row: start - 1 + 0.1 },
        ext: { width: 72, height: 92 },
      });
    }
    if (g.items.length > 1) {
      for (const col of ["A", "B", "D", "M", "N", "O", "P", "Q", "R"]) {
        ws.mergeCells(`${col}${start}:${col}${r - 1}`);
      }
    }
  }

  const now = new Date();
  const stamp = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `冠乔客户报价资料表-${safeFilePart(customer)}（${stamp}）.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportNangua(opts: { customer: string; lines: DraftLine[] }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("选款登记");
  const customer = opts.customer.trim() || "客户";

  ws.mergeCells("A1:O1");
  ws.getCell("A1").value = `南瓜谷报价资料表 · 客户：${customer}`;
  ws.getCell("A1").font = { bold: true, name: "微软雅黑", size: 14, color: { argb: "FF1F3D34" } };
  ws.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 24;

  const headers = [
    "编号",
    "送（寄）样日期",
    "工厂",
    "类目",
    "样衣图片+工厂名",
    "工厂样衣款号",
    "不含税价格",
    "含税价格",
    "货品来源",
    "样衣数量",
    "具体颜色",
    "工厂现货库存\n下单做货时间",
    "面料材质信息",
    "快递单号",
    "内部备忘",
  ];
  ws.addRow(headers);
  ws.getRow(2).font = { bold: true, name: "微软雅黑", size: 11 };
  ws.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF3FE" } };
  ws.getRow(2).alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  ws.getRow(2).height = 36;
  ws.columns = [
    { width: 8 },
    { width: 14 },
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 22 },
    { width: 22 },
    { width: 28 },
    { width: 18 },
    { width: 24 },
  ];

  const groups: { code: string; items: DraftLine[] }[] = [];
  for (const d of opts.lines) {
    const exist = groups.find((g) => g.code === d.code);
    if (exist) exist.items.push(d);
    else groups.push({ code: d.code, items: [d] });
  }

  let r = 3;
  let n = 1;
  for (const g of groups) {
    const first = g.items[0];
    const colors = [...new Set(g.items.map((d) => d.color))].join("、");
    const qty = g.items.reduce((a, b) => a + (b.qty || 1), 0);
    const price = first.price || 0;
    ws.addRow([
      n,
      "",
      "",
      first.category || "",
      "",
      first.code,
      price,
      { formula: `G${r}*1.05` },
      "",
      qty,
      colors,
      "",
      first.composition || "",
      "",
      first.memo || "",
    ]);
    ws.getRow(r).height = 72;
    ws.getRow(r).alignment = { vertical: "middle", wrapText: true };
    ws.getCell(`G${r}`).numFmt = "0.00";
    ws.getCell(`H${r}`).numFmt = "0.00";
    const b64 = await photoToBase64(first.photo);
    if (b64) {
      const imgId = wb.addImage({ base64: b64, extension: "jpeg" });
      ws.addImage(imgId, {
        tl: { col: 4.1, row: r - 1 + 0.1 },
        ext: { width: 70, height: 70 },
      });
    }
    r += 1;
    n += 1;
  }

  const sumRow = r;
  ws.addRow(["合计", "", "", "", "", "", "", "", "", { formula: `SUM(J3:J${sumRow - 1})` }, "", "", "", "", ""]);
  ws.getRow(sumRow).font = { bold: true, name: "微软雅黑" };

  const now = new Date();
  const stamp = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `南瓜谷报价资料表-${safeFilePart(customer)}（${stamp}）.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type QuoteTemplate = "qixu" | "nangua";

export async function exportByTemplate(opts: {
  template: QuoteTemplate;
  customer: string;
  lines: DraftLine[];
}) {
  if (opts.template === "nangua") return exportNangua(opts);
  return exportQuote(opts);
}

