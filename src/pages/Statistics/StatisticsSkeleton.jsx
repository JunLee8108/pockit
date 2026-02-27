import Skeleton from "../../components/Skeleton";

const StatisticsSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <Skeleton style={{ width: 80, height: 24 }} />

    {/* 기간 선택 */}
    <Skeleton style={{ width: 160, height: 32 }} className="rounded-lg" />

    {/* 월간 비교 + 카테고리 트렌드 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 80, height: 13 }} className="mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2.5">
            <Skeleton style={{ width: 40, height: 14 }} />
            <Skeleton style={{ width: 200, height: 14 }} />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
        <Skeleton
          style={{ width: "100%", height: 240 }}
          className="rounded-lg"
        />
      </div>
    </div>

    {/* 지출 패턴 + 일별 흐름 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
        <Skeleton
          style={{ width: "100%", height: 200 }}
          className="rounded-lg"
        />
      </div>
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
        <Skeleton
          style={{ width: "100%", height: 240 }}
          className="rounded-lg"
        />
      </div>
    </div>

    {/* 상위 지출 */}
    <div className="bg-surface border border-border rounded-xl p-5">
      <Skeleton style={{ width: 100, height: 13 }} className="mb-3" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton style={{ width: "40%", height: 14 }} />
            <Skeleton style={{ width: "25%", height: 12 }} />
          </div>
          <Skeleton style={{ width: 70, height: 14 }} />
        </div>
      ))}
    </div>
  </div>
);

export default StatisticsSkeleton;
