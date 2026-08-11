import { useState, useEffect, useRef, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Landmark, RefreshCw, Unlink, AlertTriangle, Plus } from "lucide-react";
import {
  usePlaidItems,
  useCreatePlaidLinkToken,
  useExchangePlaidToken,
  usePlaidSync,
  useUnlinkPlaidItem,
  MAX_PLAID_ITEMS,
} from "../../hooks/usePlaid";
import useConfirm from "../../hooks/useConfirm";

const formatSyncedAt = (iso) => {
  if (!iso) return "동기화 전";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_LABELS = {
  active: null,
  login_required: "재인증 필요",
  error: "오류",
};

const PlaidConnections = () => {
  const { data: items = [] } = usePlaidItems();
  const createToken = useCreatePlaidLinkToken();
  const exchange = useExchangePlaidToken();
  const sync = usePlaidSync();
  const unlink = useUnlinkPlaidItem();
  const confirm = useConfirm();

  const [linkToken, setLinkToken] = useState(null);
  const updateItemIdRef = useRef(null);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      if (updateItemIdRef.current) {
        // update mode(재인증) 성공 → 해당 item 재동기화
        sync.mutate({ plaidItemId: updateItemIdRef.current });
        updateItemIdRef.current = null;
      } else {
        exchange.mutate({
          publicToken,
          institution: metadata.institution ?? undefined,
        });
      }
      setLinkToken(null);
    },
    onExit: () => {
      setLinkToken(null);
      updateItemIdRef.current = null;
    },
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  const handleConnect = useCallback(async () => {
    try {
      const data = await createToken.mutateAsync({});
      setLinkToken(data.link_token);
    } catch {
      // 토스트는 mutation onError에서 처리
    }
  }, [createToken]);

  const handleReauth = useCallback(
    async (item) => {
      try {
        updateItemIdRef.current = item.id;
        const data = await createToken.mutateAsync({ plaidItemId: item.id });
        setLinkToken(data.link_token);
      } catch {
        updateItemIdRef.current = null;
      }
    },
    [createToken],
  );

  const handleUnlink = useCallback(
    async (item) => {
      const ok = await confirm({
        title: "은행 연결 해제",
        message: `"${item.institution_name || "은행"}" 연결을 해제하시겠습니까?\n계좌와 거래 내역은 유지되지만 자동 동기화가 중단됩니다.`,
        confirmText: "해제",
        variant: "danger",
      });
      if (ok) unlink.mutate({ plaidItemId: item.id });
    },
    [confirm, unlink],
  );

  const busy =
    createToken.isPending || exchange.isPending || sync.isPending;

  return (
    <div className="dash-card bg-surface shadow-sm rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] text-sub font-medium">
          은행 연결{" "}
          <span className="text-sub/70">
            {items.length}/{MAX_PLAID_ITEMS}
          </span>
        </h3>
        {items.length > 0 && (
          <button
            onClick={() => sync.mutate({})}
            disabled={busy}
            className="p-1.5 rounded-md text-sub hover:bg-light cursor-pointer bg-transparent border-none disabled:opacity-50"
            title="전체 동기화"
          >
            <RefreshCw
              size={14}
              className={sync.isPending ? "animate-spin" : ""}
            />
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-4">
          {items.map((item) => {
            const statusLabel = STATUS_LABELS[item.status] ?? "오류";
            const needsAttention = item.status !== "active";
            return (
              <div key={item.id} className="flex items-center gap-2.5">
                <Landmark size={16} className="text-sub shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text font-medium truncate">
                    {item.institution_name || "은행"}
                  </div>
                  <div className="text-[11px] text-sub">
                    {needsAttention ? (
                      <span className="text-coral inline-flex items-center gap-1">
                        <AlertTriangle size={11} />
                        {statusLabel}
                      </span>
                    ) : (
                      formatSyncedAt(item.last_synced_at)
                    )}
                  </div>
                </div>
                {needsAttention && (
                  <button
                    onClick={() => handleReauth(item)}
                    disabled={busy}
                    className="text-[11px] text-mint font-medium cursor-pointer bg-transparent border-none disabled:opacity-50"
                  >
                    재인증
                  </button>
                )}
                <button
                  onClick={() => handleUnlink(item)}
                  disabled={unlink.isPending}
                  className="p-1.5 rounded-md text-sub hover:text-coral hover:bg-light cursor-pointer bg-transparent border-none disabled:opacity-50"
                  title="연결 해제"
                >
                  <Unlink size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={busy || items.length >= MAX_PLAID_ITEMS}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer border border-dashed border-border text-sub hover:text-mint hover:border-mint bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createToken.isPending || exchange.isPending ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : (
          <Plus size={15} />
        )}
        {exchange.isPending
          ? "계좌 가져오는 중..."
          : items.length >= MAX_PLAID_ITEMS
            ? "연결 한도 도달"
            : "은행 연결하기"}
      </button>
    </div>
  );
};

export default PlaidConnections;
