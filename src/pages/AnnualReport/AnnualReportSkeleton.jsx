import Skeleton from "../../components/Skeleton";

const AnnualReportSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <Skeleton style={{ width: 100, height: 24 }} />

    {/* 연도 선택 */}
    <Skeleton style={{ width: 120, height: 32 }} className="rounded-lg" />

    {/* KPI 카드 */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <Skeleton style={{ width: 80, height: 13 }} className="mb-3" />
          <Skeleton style={{ width: "70%", height: 22 }} className="mb-2" />
          <Skeleton style={{ width: 60, height: 12 }} />
        </div>
      ))}
    </div>

    {/* 월별 차트 */}
    <div className="bg-surface border border-border rounded-xl p-5">
      <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
      <Skeleton
        style={{ width: "100%", height: 300 }}
        className="rounded-lg"
      />
    </div>

    {/* 카테고리 순위 + 전년 대비 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-4 h-4 rounded" />
            <div className="flex-1">
              <Skeleton style={{ width: "60%", height: 14 }} className="mb-1" />
              <Skeleton style={{ width: "100%", height: 6 }} className="rounded-full" />
            </div>
            <Skeleton style={{ width: 40, height: 12 }} />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 80, height: 13 }} className="mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2.5">
            <Skeleton style={{ width: 40, height: 14 }} />
            <Skeleton style={{ width: 200, height: 14 }} />
          </div>
        ))}
      </div>
    </div>

    {/* 월별 테이블 */}
    <div className="bg-surface border border-border rounded-xl p-5">
      <Skeleton style={{ width: 80, height: 13 }} className="mb-4" />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex justify-between py-2.5 border-b border-border">
          <Skeleton style={{ width: 30, height: 14 }} />
          <Skeleton style={{ width: 70, height: 14 }} />
          <Skeleton style={{ width: 70, height: 14 }} />
          <Skeleton style={{ width: 70, height: 14 }} />
        </div>
      ))}
    </div>
  </div>
);

export default AnnualReportSkeleton;
