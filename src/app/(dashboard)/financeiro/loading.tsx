import { SkeletonCards, SkeletonHeader, SkeletonPanel, SkeletonScreen, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonHeader withAction />
      <SkeletonCards count={6} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={4} />
      </div>
      <div className="mt-4">
        <SkeletonTable rows={6} columns={6} />
      </div>
    </SkeletonScreen>
  );
}
