import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import supabase from "../lib/supabase";
import { useAccounts } from "./useAccounts";
import { useCategories } from "./useCategories";

const PAGE_SIZE = 20;

const useGlobalSearch = (query) => {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  // 거래 서버 검색 상태
  const [txResults, setTxResults] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txOffset, setTxOffset] = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const abortRef = useRef(null);

  const trimmed = query.trim().toLowerCase();
  const isValid = trimmed.length >= 2;

  // 거래 서버 검색
  const searchTransactions = useCallback(
    async (offset = 0, append = false) => {
      if (!isValid) return;
      setTxLoading(true);

      try {
        const { data, count, error } = await supabase
          .from("transactions")
          .select(
            "*, category:categories(*), account:accounts!account_id(*)",
            { count: "exact" },
          )
          .or(
            `description.ilike.%${trimmed}%,memo.ilike.%${trimmed}%`,
          )
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        if (append) {
          setTxResults((prev) => [...prev, ...(data || [])]);
        } else {
          setTxResults(data || []);
        }
        setTxTotal(count || 0);
        setTxOffset(offset + PAGE_SIZE);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        setTxLoading(false);
      }
    },
    [trimmed, isValid],
  );

  // 검색어 변경 시 디바운스 + 리셋
  const debounceRef = useRef(null);
  useEffect(() => {
    setTxResults([]);
    setTxTotal(0);
    setTxOffset(0);

    if (!isValid) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchTransactions(0, false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [trimmed, isValid, searchTransactions]);

  const loadMoreTx = useCallback(() => {
    searchTransactions(txOffset, true);
  }, [searchTransactions, txOffset]);

  const hasMoreTx = txOffset < txTotal;

  // 클라이언트 필터 — 계좌
  const accountResults = useMemo(() => {
    if (!isValid) return [];
    return accounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(trimmed) ||
        a.institution?.toLowerCase().includes(trimmed),
    );
  }, [accounts, trimmed, isValid]);

  // 클라이언트 필터 — 카테고리
  const categoryResults = useMemo(() => {
    if (!isValid) return [];
    return categories.filter((c) =>
      c.name?.toLowerCase().includes(trimmed),
    );
  }, [categories, trimmed, isValid]);

  const totalCount =
    txTotal + accountResults.length + categoryResults.length;

  return {
    isValid,
    transactions: { data: txResults, total: txTotal, loading: txLoading, hasMore: hasMoreTx, loadMore: loadMoreTx },
    accounts: { data: accountResults, total: accountResults.length },
    categories: { data: categoryResults, total: categoryResults.length },
    totalCount,
  };
};

export default useGlobalSearch;
