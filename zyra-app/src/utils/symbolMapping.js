import { ASSETS } from "../constants/symbols.js";

const SYMBOL_MAP = {
  MATIC: "POLUSDT",
  MATICUSDT: "POLUSDT",
};

const USD_LIKE_ASSETS = new Set(["USD", "USDT", "USDC", "BUSD"]);
const SUPPORTED_ASSETS = [...ASSETS];
const SUPPORTED_ASSET_SET = new Set(SUPPORTED_ASSETS);

function normalizeSymbolKey(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().toUpperCase();
}

function isUsdLikeAsset(asset) {
  return USD_LIKE_ASSETS.has(normalizeSymbolKey(asset));
}

function toAssetCode(value) {
  const normalizedValue = normalizeSymbolKey(value);

  if (!normalizedValue) {
    return "";
  }

  if (SYMBOL_MAP[normalizedValue]) {
    return SYMBOL_MAP[normalizedValue].replace(/USDT$/, "");
  }

  if (normalizedValue.endsWith("USDT")) {
    return normalizedValue.replace(/USDT$/, "");
  }

  return normalizedValue;
}

function isSupportedAsset(asset) {
  return SUPPORTED_ASSET_SET.has(toAssetCode(asset));
}

function filterSupportedAssets(assets = []) {
  return assets.filter((asset) => isSupportedAsset(asset));
}

function toMarketSymbol(value) {
  const normalizedValue = normalizeSymbolKey(value);

  if (!normalizedValue) {
    return "";
  }

  if (SYMBOL_MAP[normalizedValue]) {
    return SYMBOL_MAP[normalizedValue];
  }

  if (normalizedValue.endsWith("USDT")) {
    return normalizedValue;
  }

  return `${normalizedValue}USDT`;
}

export {
  SUPPORTED_ASSETS,
  SYMBOL_MAP,
  filterSupportedAssets,
  isSupportedAsset,
  isUsdLikeAsset,
  normalizeSymbolKey,
  toAssetCode,
  toMarketSymbol,
};
