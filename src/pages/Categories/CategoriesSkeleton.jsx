import Skeleton from "../../components/Skeleton";

const CardSkeleton = () => (
  <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
    <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
    <div className="flex-1 flex flex-col gap-1.5">
      <Skeleton style={{ width: "35%", height: 14 }} />
      <Skeleton style={{ width: "15%", height: 11 }} />
    </div>
    <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
  </div>
);

const CategoriesSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton style={{ width: 120, height: 24 }} />
      <Skeleton style={{ width: 120, height: 36 }} className="rounded-lg" />
    </div>

    {/* Tabs */}
    <Skeleton style={{ width: 200, height: 40 }} className="rounded-lg" />

    {/* Cards */}
    <div className="flex flex-col gap-2">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default CategoriesSkeleton;
