import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.45fr)] lg:gap-5">
        <Skeleton className="min-h-80 rounded-[2rem] sm:min-h-88" />
        <div className="rounded-3xl bg-secondary/55 p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
            <Skeleton className="h-20 rounded-2xl lg:h-16" />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <Skeleton className="mb-5 h-6 w-40" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton className="h-16 rounded-2xl" key={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
