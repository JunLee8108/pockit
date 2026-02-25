import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

/**
 * TanStack Query 캐시에 있는 모든 월별 거래 데이터에서
 * 고유한 { description, categoryId } 쌍을 최근 사용 순으로 반환
 */
const useDescriptionSuggestions = () => {
  const qc = useQueryClient();

  return useMemo(() => {
    const cache = qc.getQueriesData({
      queryKey: queryKeys.transactions.all,
    });

    // 모든 캐시된 월 데이터를 하나로 합침
    const allTx = [];
    cache.forEach(([, data]) => {
      if (Array.isArray(data)) allTx.push(...data);
    });

    // 최근 날짜 순 정렬
    allTx.sort((a, b) => b.date.localeCompare(a.date));

    // description 기준 중복 제거 (가장 최근 것만 유지)
    const seen = new Set();
    const suggestions = [];

    allTx.forEach((tx) => {
      const desc = tx.description?.trim();
      if (!desc) return;

      const key = desc.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      suggestions.push({
        description: desc,
        categoryId: tx.category_id,
        categoryName: tx.category?.name || null,
        categoryIcon: tx.category?.icon || null,
        categoryColor: tx.category?.color || null,
        type: tx.type,
      });
    });

    return suggestions;
  }, [qc]);
};

export default useDescriptionSuggestions;
