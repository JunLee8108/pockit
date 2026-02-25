import Skeleton from "../../components/Skeleton";

const AccountCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton style={{ width: "40%", height: 14 }} />
      <Skeleton style={{ width: "25%", height: 12 }} />
    </div>
    <div className="flex flex-col items-end gap-2">
      <Skeleton style={{ width: 80, height: 16 }} />
      <Skeleton style={{ width: 30, height: 11 }} />
    </div>
  </div>
);

const AccountsSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton style={{ width: 120, height: 24 }} />
      <Skeleton style={{ width: 100, height: 36 }} className="rounded-lg" />
    </div>

    {/* 2-Column */}
    <div className="flex flex-col lg:flex-row gap-5">
      {/* 좌측 패널 */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
        {/* 총 자산 요약 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 80, height: 13 }} className="mb-4" />
          <div className="flex flex-col gap-2">
            <Skeleton style={{ width: 70, height: 12 }} />
            <Skeleton style={{ width: 160, height: 24 }} />
          </div>
        </div>

        {/* 빠른 통계 */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 70, height: 13 }} className="mb-3" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton style={{ width: 50, height: 13 }} />
                <Skeleton style={{ width: 40, height: 13 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 목록 */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {[1, 2].map((group) => (
          <div key={group}>
            <Skeleton style={{ width: 60, height: 13 }} className="mb-3" />
            <div className="flex flex-col gap-2">
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              {group === 1 && <AccountCardSkeleton />}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AccountsSkeleton;
