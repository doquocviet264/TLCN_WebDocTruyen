import { Skeleton } from "@/components/ui/skeleton";

export function CommentSkeleton() {
  return (
    <div className="flex items-start gap-2 animate-pulse">
      <Skeleton className="h-7 w-7 rounded-full " />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40 rounded " />
        <Skeleton className="h-3 w-3/4 rounded " />
      </div>
    </div>
  );
}