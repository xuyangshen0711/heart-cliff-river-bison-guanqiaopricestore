export type Style = {
  code: string;
  aliases: string[];
  colors: string[];
  sizeRange: string;
  price: number | null;
  composition: string;
  weight: string;
  standard: string;
  safety: string;
  note: string;
  memo: string;
  category: string;
  photo: string;
  season: string;
  listed: boolean;
};

export type DraftLine = {
  id: string;
  code: string;
  color: string;
  qty: number;
  price: number;
  sizeRange: string;
  composition: string;
  weight: string;
  standard: string;
  safety: string;
  note: string;
  memo: string;
  photo: string;
  category: string;
};

export const CATS = ["上衣", "套装", "马甲", "裙装", "内搭", "裤子"] as const;
export const SEASONS = ["26秋", "26冬"] as const;
