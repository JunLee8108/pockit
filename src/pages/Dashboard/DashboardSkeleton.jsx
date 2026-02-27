import Skeleton from "../../components/Skeleton";

const KpiSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2">
    <Skeleton style={{ width: 80, height: 13 }} />
    <Skeleton style={{ width: 140, height: 24 }} />
    <Skeleton style={{ width: 60, height: 12 }} />
  </div>
);

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <Skeleton style={{ width: 100, height: 24 }} />

    {/* KPI */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
    </div>

    {/* Chart */}
    <div className="bg-surface border border-border rounded-xl p-5">
      <Skeleton style={{ width: 100, height: 13 }} className="mb-4" />
      <Skeleton style={{ width: "100%", height: 280 }} className="rounded-lg" />
    </div>

    {/* 2-col */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 90, height: 13 }} className="mb-3" />
        <Skeleton
          style={{ width: "100%", height: 200 }}
          className="rounded-lg"
        />
      </div>
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton style={{ width: 70, height: 13 }} className="mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <Skeleton style={{ width: "40%", height: 14 }} />
            <Skeleton style={{ width: 80, height: 14 }} className="ml-auto" />
          </div>
        ))}
      </div>
    </div>

    {/* Recent */}
    <div>
      <Skeleton style={{ width: 70, height: 13 }} className="mb-3" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 mb-2"
        >
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton style={{ width: "35%", height: 14 }} />
            <Skeleton style={{ width: "25%", height: 12 }} />
          </div>
          <Skeleton style={{ width: 70, height: 16 }} className="shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export default DashboardSkeleton;
