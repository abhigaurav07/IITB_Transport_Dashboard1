import type { Condition, Rating } from "./types";

/**
 * IRC:SP:16-2019 roughness limits (IRI, m/km). Good below `good`, Poor above `fair`.
 * The limits were read from the standard through a text extraction;
 * please verify them against the published copy before client use.
 */
export interface RatingGroup {
  group: string;
  table: string;
  options: { id: string; label: string; good: number; fair: number }[];
}

export const RATING_GROUPS: RatingGroup[] = [
  {
    group: "Expressway, NH, SH",
    table: "Table 3.1",
    options: [
      { id: "nhb", label: "Bituminous (BC, SMA, SDBC)", good: 2.55, fair: 3.3 },
      { id: "nhc", label: "Cemented", good: 2.81, fair: 3.3 },
    ],
  },
  {
    group: "Major and other district roads",
    table: "Table 3.2",
    options: [
      { id: "dsd", label: "Surface dressing", good: 4.03, fair: 4.98 },
      { id: "dog", label: "Open graded premix carpet", good: 3.79, fair: 4.62 },
      { id: "dms", label: "Mix seal surfacing", good: 3.55, fair: 4.27 },
      { id: "dsb", label: "Semi dense bituminous concrete", good: 3.05, fair: 4.03 },
      { id: "dbc", label: "Bituminous concrete", good: 2.81, fair: 3.55 },
      { id: "dcc", label: "Cement concrete", good: 3.05, fair: 3.55 },
    ],
  },
  {
    group: "Village roads",
    table: "Table 3.3",
    options: [
      { id: "vsd", label: "Surface dressing", good: 4.27, fair: 4.98 },
      { id: "vog", label: "Open graded premix carpet", good: 4.03, fair: 4.62 },
      { id: "vms", label: "Mix seal surfacing", good: 3.79, fair: 4.27 },
      { id: "vsb", label: "Semi dense bituminous concrete", good: 3.3, fair: 4.03 },
      { id: "vcc", label: "Cement concrete", good: 3.05, fair: 3.55 },
    ],
  },
];

export const DEFAULT_RATING_ID = "nhb";

export function ratingById(id: string): Rating {
  for (const g of RATING_GROUPS) for (const o of g.options) if (o.id === id) return { id, good: o.good, fair: o.fair };
  return { id: DEFAULT_RATING_ID, good: 2.55, fair: 3.3 };
}
export function ratingName(id: string): { table: string; text: string } {
  for (const g of RATING_GROUPS) for (const o of g.options) if (o.id === id) return { table: g.table, text: `${g.group}, ${o.label}` };
  return { table: "", text: "" };
}
export function conditionOf(v: number | null | undefined, r: Rating): Condition | null {
  if (v == null) return null;
  return v < r.good ? "Good" : v <= r.fair ? "Fair" : "Poor";
}
