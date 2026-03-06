import Skeleton from "../../components/Skeleton";

const CardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton style={{ width: "40%", height: 14 }} />
        <Skeleton style={{ width: "20%", height: 11 }} />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton style={{ width: 80, height: 14 }} />
        <Skeleton style={{ width: 60, height: 12 }} />
      </div>
    </div>
    <Skeleton style={{ width: "100%", height: 8 }} className="rounded-full" />
    <div className="flex justify-between mt-2">
      <Skeleton style={{ width: 70, height: 12 }} />
      <Skeleton style={{ width: 30, height: 12 }} />
    </div>
  </div>
);

const BudgetSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton style={{ width: 80, height: 24 }} />
      <Skeleton style={{ width: 100, height: 36 }} className="rounded-lg" />
    </div>

    {/* Period */}
    <Skeleton style={{ width: 160, height: 32 }} className="rounded-lg" />

    {/* 2-Column */}
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 좌측 패널 */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
          <Skeleton style={{ width: 160, height: 28 }} className="mb-3" />
          <Skeleton
            style={{ width: "100%", height: 8 }}
            className="rounded-full mb-3"
          />
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton style={{ width: 60, height: 13 }} />
                <Skeleton style={{ width: 70, height: 13 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 100, height: 13 }} className="mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-2">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton style={{ width: "50%", height: 13 }} />
              <Skeleton style={{ width: 40, height: 13 }} className="ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 우측 카드 */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

export default BudgetSkeleton;
