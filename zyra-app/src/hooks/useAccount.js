import { useEffect, useRef, useState } from "react";

import { getAccountInfo, getBalance } from "../services/accountService.js";
import { getPrices } from "../services/marketService.js";
import { limitItems, pickFirst, toArray, toNumber, toObject } from "../utils/apiTransforms.js";
import { filterSupportedAssets, isSupportedAsset, isUsdLikeAsset } from "../utils/symbolMapping.js";

function normalizeAccountInfo(payload) {
  const info = toObject(payload);

  return {
    accountType: pickFirst(info, ["accountType", "type"], "Spot"),
    canTrade: Boolean(pickFirst(info, ["canTrade", "tradeEnabled"], true)),
    canWithdraw: Boolean(pickFirst(info, ["canWithdraw", "withdrawEnabled"], true)),
    canDeposit: Boolean(pickFirst(info, ["canDeposit", "depositEnabled"], true)),
    makerCommission: toNumber(pickFirst(info, ["makerCommission"]), 0),
    takerCommission: toNumber(pickFirst(info, ["takerCommission"]), 0),
    updateTime: pickFirst(info, ["updateTime", "serverTime"], null),
  };
}

function normalizeBalances(payload) {
  return toArray(payload, ["balances", "assets", "items"])
    .map((balance) => {
      const free = toNumber(pickFirst(balance, ["free", "available", "balance"]), 0);
      const locked = toNumber(pickFirst(balance, ["locked", "freeze", "hold"]), 0);
      const total = toNumber(pickFirst(balance, ["total"]), free + locked);
      const asset = pickFirst(balance, ["asset", "symbol", "currency"], "");

      return {
        asset,
        free,
        locked,
        total,
      };
    })
    .filter((balance) => balance.asset && balance.free > 0)
    .sort((left, right) => right.total - left.total);
}

function enrichBalancesWithUsdValue(balances, assetPrices) {
  return balances
    .map((balance) => {
      const unitPrice = isUsdLikeAsset(balance.asset) ? 1 : assetPrices[balance.asset] ?? 0;
      return {
        ...balance,
        unitPrice,
        usdValue: balance.total * unitPrice,
      };
    })
    .sort((left, right) => right.usdValue - left.usdValue);
}

function useAccount({ maxBalances = 10 } = {}) {
  const [accountInfo, setAccountInfo] = useState(null);
  const [balances, setBalances] = useState([]);
  const [fiatBalances, setFiatBalances] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const [infoResponse, balanceResponse] = await Promise.all([
          getAccountInfo(),
          getBalance(),
        ]);

        const normalizedBalances = normalizeBalances(balanceResponse);
        const fiatOnlyBalances = limitItems(
          normalizedBalances.filter((balance) => isUsdLikeAsset(balance.asset)),
          maxBalances,
        );
        const supportedCryptoBalances = limitItems(
          normalizedBalances.filter((balance) => !isUsdLikeAsset(balance.asset) && isSupportedAsset(balance.asset)),
          maxBalances,
        );
        const assetsNeedingPrices = filterSupportedAssets(
          supportedCryptoBalances.map((balance) => balance.asset),
        );

        let assetPrices = {};
        try {
          assetPrices = await getPrices(assetsNeedingPrices);
        } catch {
          assetPrices = {};
        }

        if (cancelled) {
          return;
        }

        const enrichedBalances = enrichBalancesWithUsdValue(supportedCryptoBalances, assetPrices);

        setAccountInfo(normalizeAccountInfo(infoResponse));
        setBalances(enrichedBalances);
        setFiatBalances(fiatOnlyBalances);
        setPortfolioValue(
          enrichedBalances.reduce((total, balance) => total + balance.usdValue, 0),
        );
        hasLoadedRef.current = true;
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, [maxBalances, refreshKey]);

  return {
    accountInfo,
    balances,
    fiatBalances,
    portfolioValue,
    loading,
    refreshing,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}

export default useAccount;
