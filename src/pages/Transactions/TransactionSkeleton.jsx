import Skeleton from "../../components/Skeleton";

const CardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton style={{ width: "35%", height: 14 }} />
      <Skeleton style={{ width: "25%", height: 12 }} />
    </div>
    <Skeleton style={{ width: 70, height: 16 }} className="shrink-0" />
  </div>
);

const TransactionSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <Skeleton style={{ width: 100, height: 24 }} />
      <Skeleton style={{ width: 100, height: 36 }} className="rounded-lg" />
    </div>

    <div className="flex flex-col lg:flex-row gap-5">
      {/* 좌측 */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 80, height: 13 }} className="mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton style={{ width: 40, height: 13 }} />
                <Skeleton style={{ width: 80, height: 16 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <Skeleton style={{ width: 90, height: 13 }} className="mb-3" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between mb-2">
              <Skeleton style={{ width: 60, height: 13 }} />
              <Skeleton style={{ width: 30, height: 13 }} />
            </div>
          ))}
        </div>
      </div>

      {/* 우측 */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <Skeleton style={{ height: 44 }} className="rounded-lg" />
        {[1, 2].map((g) => (
          <div key={g}>
            <Skeleton style={{ width: 100, height: 13 }} className="mb-2" />
            <div className="flex flex-col gap-2">
              <CardSkeleton />
              <CardSkeleton />
              {g === 1 && <CardSkeleton />}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TransactionSkeleton;
