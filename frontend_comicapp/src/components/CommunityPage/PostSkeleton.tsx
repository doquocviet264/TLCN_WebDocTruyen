import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="rounded-2xl border  p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full " />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 rounded " />
          <Skeleton className="mt-2 h-3 w-24 rounded 0" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full rounded " />
        <Skeleton className="h-3 w-11/12 rounded " />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-28 rounded-xl " />
        <Skeleton className="h-28 rounded-xl " />
        <Skeleton className="h-28 rounded-xl " />
      </div>
      <Skeleton className="mt-4 h-9 w-40 rounded-full " />
    </div>
  );
}