import { create } from "zustand";
import type { DraftLine, Style } from "./types";

const LS_KEY = "qixu-draft-v1";

type DeskState = {
  hydrated: boolean;
  draft: DraftLine[];
  customer: string;
  query: string;
  hydrate: () => void;
  setQuery: (q: string) => void;
  setCustomer: (c: string) => void;
  addColors: (style: Style, colors: string[]) => void;
  setQty: (id: string, qty: number) => void;
  setPrice: (id: string, price: number) => void;
  removeLine: (id: string) => void;
  clearDraft: () => void;
};

function load() {
  if (typeof window === "undefined") {
    return { draft: [] as DraftLine[], customer: "客户", query: "" };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { draft: [] as DraftLine[], customer: "客户", query: "" };
    const p = JSON.parse(raw) as { draft?: DraftLine[]; customer?: string; query?: string };
    return {
      draft: p.draft ?? [],
      customer: p.customer || "客户",
      query: p.query || "",
    };
  } catch {
    return { draft: [] as DraftLine[], customer: "客户", query: "" };
  }
}

function persist(s: DeskState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ draft: s.draft, customer: s.customer, query: s.query }),
    );
  } catch {
    /* ignore */
  }
}

function lineFrom(style: Style, color: string): DraftLine {
  return {
    id: `${style.code}::${color}`,
    code: style.code,
    color,
    qty: 1,
    price: style.price ?? 0,
    sizeRange: style.sizeRange,
    composition: style.composition,
    weight: style.weight,
    standard: style.standard,
    safety: style.safety,
    note: style.note,
    memo: style.memo ?? "",
    photo: style.photo,
    category: style.category,
  };
}

export const useDesk = create<DeskState>((set, get) => ({
  hydrated: false,
  draft: [],
  customer: "客户",
  query: "",
  hydrate: () => set({ ...load(), hydrated: true }),
  setQuery: (query) => {
    set({ query });
    persist(get());
  },
  setCustomer: (customer) => {
    set({ customer });
    persist(get());
  },
  addColors: (style, colors) => {
    const picked = colors.filter(Boolean);
    if (!picked.length) return;
    const draft = [...get().draft];
    for (const color of picked) {
      const id = `${style.code}::${color}`;
      const exist = draft.find((d) => d.id === id);
      if (exist) exist.qty += 1;
      else draft.push(lineFrom(style, color));
    }
    set({ draft });
    persist(get());
  },
  setQty: (id, qty) => {
    set({
      draft: get().draft.map((d) => (d.id === id ? { ...d, qty: Math.max(1, qty) } : d)),
    });
    persist(get());
  },
  setPrice: (id, price) => {
    set({
      draft: get().draft.map((d) => (d.id === id ? { ...d, price: Math.max(0, price) } : d)),
    });
    persist(get());
  },
  removeLine: (id) => {
    set({ draft: get().draft.filter((d) => d.id !== id) });
    persist(get());
  },
  clearDraft: () => {
    set({ draft: [] });
    persist(get());
  },
}));
