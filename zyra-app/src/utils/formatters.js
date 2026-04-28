function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function fmtMoney(n, decimals = 2) {
  if (Math.abs(n) >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return "$" + n.toFixed(decimals);
}

function fmtPct(n) {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export { generateId, fmtMoney, fmtPct };
