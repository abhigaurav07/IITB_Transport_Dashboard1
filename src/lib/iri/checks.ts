import type { Rating, Route } from "./types";
import { blockLenM } from "./routes";
import { conditionOf, ratingName } from "./rating";

export interface Check {
  title: string;
  detail: string;
  status: "OK" | "Review";
}

/** Data checks computed from whatever is loaded for the shown route. */
export function computeChecks(r: Route, rating: Rating): Check[] {
  const out: Check[] = [];
  const act = r.active;
  const steps: number[] = [];
  for (let i = 0; i < r.n - 1; i++) steps.push(blockLenM(r, i) ?? 0);
  const sorted = [...steps].sort((a, b) => a - b);
  const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
  const med = sorted[Math.floor(sorted.length / 2)];
  const big = steps.filter((x) => x > 100).length;
  const maxd = Math.max(...act.map((m) => m.maxDiffM));
  const n = act.length;

  out.push({
    title: "All files describe the same road.",
    detail: `${n} driver file${n === 1 ? " uses" : "s share"} one reference route of ${r.km[r.n - 1].toFixed(1)} km with ${r.n.toLocaleString()} reference points. Reference point coordinates agree across files (largest difference ${maxd.toFixed(1)} m).${
      r.gaps ? ` ${r.gaps} reference index jump${r.gaps === 1 ? "" : "s"} found; the blocks across a jump are joined.` : ""
    }`,
    status: r.gaps ? "Review" : "OK",
  });

  const cnt: Record<number, number> = {};
  for (let i = 0; i < r.n - 1; i++) cnt[r.nd[i]] = (cnt[r.nd[i]] ?? 0) + 1;
  const ks = Object.keys(cnt).map(Number).filter((k) => k > 0).sort((a, b) => b - a);
  out.push({
    title: "Blocks line up, so they can be averaged.",
    detail: `Every reference point has a number (ref_idx) shared by all files, so each block is compared like with like. The average of a block is the arithmetic mean of the drivers who covered it: ${ks
      .map((k) => `${cnt[k].toLocaleString()} block${cnt[k] === 1 ? "" : "s"} with ${k} driver${k === 1 ? "" : "s"}`)
      .join(", ")}${cnt[0] ? `, ${cnt[0]} with none` : ""}.`,
    status: "OK",
  });

  out.push({
    title: "Each block is about 50 m long.",
    detail: `Reference points are ${mean.toFixed(1)} m apart on average (median ${med.toFixed(1)} m). ${big} block${big === 1 ? "" : "s"} exceed${big === 1 ? "s" : ""} 100 m and the longest is ${sorted[sorted.length - 1].toFixed(0)} m. A longer block is still averaged as one block.`,
    status: big / steps.length > 0.01 || Math.abs(med - 50) > 15 ? "Review" : "OK",
  });

  let tg = 0;
  let tn = 0;
  const gapText = act.map((m) => {
    let first = -1;
    let last = -1;
    let c = 0;
    m.iri.forEach((v, i) => {
      if (v != null) {
        if (first < 0) first = i;
        last = i;
        c++;
      }
    });
    const miss = last - first + 1 - c;
    tg += miss;
    tn += c;
    return `${m.label}: ${miss}`;
  });
  out.push({
    title: "Each driver has a value for every block in the range driven.",
    detail: `Blocks missing inside each driver's own range: ${gapText.join(", ")}. The viewer shows these as gaps.`,
    status: tn && tg / tn > 0.02 ? "Review" : "OK",
  });

  const pool: number[] = [];
  act.forEach((m) => m.iri.forEach((v) => v != null && pool.push(v)));
  pool.sort((a, b) => a - b);
  if (pool.length) {
    const m = pool[Math.floor(pool.length / 2)];
    const near = pool.filter((v) => Math.abs(v - m) <= 0.02).length / pool.length;
    out.push({
      title: "IRI should vary along the road.",
      detail: `${(100 * near).toFixed(0)} percent of all driver values lie within 0.02 of the median (${m.toFixed(2)}). ${(
        (100 * pool.filter((v) => v > rating.fair).length) /
        pool.length
      ).toFixed(0)} percent are above ${rating.fair.toFixed(2)}. A very narrow cluster can mean the model returns a near constant value.`,
      status: near > 0.4 ? "Review" : "OK",
    });
  }

  if (n > 1) {
    const dm: number[] = [];
    const rr: number[] = [];
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++) {
        const x = act[a].iri;
        const y = act[b].iri;
        let c = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, ad = 0;
        for (let i = 0; i < r.n; i++) {
          const xi = x[i];
          const yi = y[i];
          if (xi != null && yi != null) {
            c++; sx += xi; sy += yi; sxx += xi * xi; syy += yi * yi; sxy += xi * yi; ad += Math.abs(xi - yi);
          }
        }
        if (c >= 30) {
          dm.push(ad / c);
          const den = Math.sqrt((c * sxx - sx * sx) * (c * syy - sy * sy));
          if (den > 0) rr.push((c * sxy - sx * sy) / den);
        }
      }
    if (dm.length && rr.length) {
      const rmin = Math.min(...rr);
      out.push({
        title: "Different drivers should agree on the same block.",
        detail: `Mean absolute difference between two drivers on the same block: ${Math.min(...dm).toFixed(2)} to ${Math.max(...dm).toFixed(2)} IRI. Block by block correlation r: ${rmin.toFixed(2)} to ${Math.max(...rr).toFixed(2)}.`,
        status: rmin < 0.5 ? "Review" : "OK",
      });
    }
  }

  let good = 0, tot = 0, poor = 0;
  for (let i = 0; i < r.n - 1; i++) {
    const v = r.avg[i];
    if (v == null) continue;
    const l = blockLenM(r, i) ?? 0;
    tot += l;
    const c = conditionOf(v, rating);
    if (c === "Good") good += l;
    else if (c === "Poor") poor += l;
  }
  const nm = ratingName(rating.id);
  out.push({
    title: "Condition classes follow IRC:SP:16-2019.",
    detail: `Under ${nm.table}, ${nm.text} (Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}), ${((100 * poor) / tot).toFixed(1)} percent of the route length is Poor and ${((100 * good) / tot).toFixed(1)} percent is Good. Please confirm the road class, the thresholds and the IRI unit.`,
    status: poor / tot > 0.9 ? "Review" : "OK",
  });
  return out;
}
