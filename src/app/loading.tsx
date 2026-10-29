import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page...</span>
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-3/4 max-w-md" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-5 w-5/6 max-w-lg" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="mx-auto aspect-[4/5] w-full max-w-xs sm:max-w-sm" />
      </div>
      <div className="mt-12 space-y-5">
        <Skeleton className="h-8 w-56 max-w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="aspect-[3/4]" />
          ))}
        </div>
      </div>
    </div>
  );
}
