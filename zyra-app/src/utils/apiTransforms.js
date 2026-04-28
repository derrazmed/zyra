function pickFirst(source, keys, fallback = null) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function toObject(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const nestedData = payload.data;
    if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
      return nestedData;
    }

    return payload;
  }

  return {};
}

function toArray(payload, keys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }

    if (Array.isArray(payload?.data?.[key])) {
      return payload.data[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return new Date(numericValue).toISOString();
  }

  return new Date().toISOString();
}

function limitItems(items, limit = 20) {
  return items.slice(0, Math.max(0, limit));
}

function quoteAssetPrice(asset, prices = {}) {
  if (!asset) {
    return 0;
  }

  if (["USDT", "USDC", "BUSD", "USD"].includes(asset)) {
    return 1;
  }

  return toNumber(prices[`${asset}USDT`], 0);
}

export {
  limitItems,
  normalizeTimestamp,
  pickFirst,
  quoteAssetPrice,
  toArray,
  toNumber,
  toObject,
};
