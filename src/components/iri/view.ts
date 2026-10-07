import type { ColorCtx } from "@/lib/iri/scale";
import type { Rating, Route, Selection } from "@/lib/iri/types";

/** Everything the four result tabs need to draw the shown route. */
export interface View {
  route: Route;
  routes: Route[];
  rating: Rating;
  color: ColorCtx;
  selection: Selection;
  /** Values of the selected driver, or the block averages. */
  series: (number | null)[];
  cur: number;
  setCur: (i: number, from?: "drive" | "other") => void;
  selectRoute: (id: string) => void;
  openPanel: (tab: "files" | "sum" | "basis") => void;
  selectedLabel: string;
}
