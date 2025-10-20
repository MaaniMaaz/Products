const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const m = String(v).replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
};

const parseUnitCost = (value) => {
  if (!value) return null;
  
  const strValue = String(value).trim();
  
  // Remove dollar sign if present
  const cleanValue = strValue.replace(/^\$/, '');
  
  // Return the numeric value
  return cleanValue;
};

const calcMetrics = (basePrice, amazonBb, amazonFees) => {
  const profit = amazonBb - (basePrice + amazonFees);
  const margin = amazonBb > 0 ? (profit / amazonBb) * 100 : 0;
  const roi = basePrice > 0 ? (profit / basePrice) * 100 : 0;
  return { basePrice, profit, margin, roi };
};

const applyRoiCapWithHistory = (basePrice0, amazonBb, amazonFees) => {
  // First round calculation (before capping)
  const firstRound = calcMetrics(basePrice0, amazonBb, amazonFees);
  
  let isCapped = false;
  let secondRound = { ...firstRound };

  // Second round calculation (after capping if needed)
  if (basePrice0 > 0 && firstRound.roi > 40) {
    const S = amazonBb - amazonFees; // Net revenue
    const cappedBasePrice = S / 1.4;
    secondRound = calcMetrics(cappedBasePrice, amazonBb, amazonFees);
    isCapped = true;
  }

  return {
    // First round (pre-cap)
    firstRound: {
      basePrice: firstRound.basePrice,
      profit: firstRound.profit,
      margin: firstRound.margin,
      roi: firstRound.roi
    },
    // Second round (post-cap)
    secondRound: {
      basePrice: secondRound.basePrice,
      profit: secondRound.profit,
      margin: secondRound.margin,
      roi: secondRound.roi
    },
    isCapped
  };
};

module.exports = {
  toNum,
  calcMetrics,
  applyRoiCapWithHistory,
  parseUnitCost
};
