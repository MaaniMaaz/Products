// === Helper functions ===
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const m = String(v).replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
};

const calcMetrics = (basePrice, amazonBb, amazonFees) => {
  const profit = amazonBb - (basePrice + amazonFees);
  const margin = amazonBb > 0 ? (profit / amazonBb) * 100 : 0;
  const roi = basePrice > 0 ? (profit / basePrice) * 100 : 0;
  return { basePrice, profit, margin, roi };
};

const applyRoiCap = (basePrice0, amazonBb, amazonFees) => {
  let { basePrice, profit, margin, roi } = calcMetrics(basePrice0, amazonBb, amazonFees);
  let isCapped = false;

  if (basePrice > 0 && roi > 40) {
    const S = amazonBb - amazonFees; // Net revenue
    basePrice = S / 1.4;
    ({ profit, margin, roi } = calcMetrics(basePrice, amazonBb, amazonFees));
    isCapped = true;
  }

  return { basePrice, profit, margin, roi, isCapped };
};

module.exports = {
  toNum,
  calcMetrics,
  applyRoiCap
};
