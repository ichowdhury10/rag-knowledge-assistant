import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Round it into a circle (for avatars) */
  circle?: boolean;
}

/**
 * Shimmer loading placeholder.
 * Usage: <Skeleton className="h-4 w-32" /> or <Skeleton circle className="w-8 h-8" />
 */
export function Skeleton({ className, circle }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shimmer bg-slate-800",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
    />
  );
}

/** Stack of skeletons for a document list row */
export function DocumentRowSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 border-l-2 border-transparent">
      <Skeleton className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}
