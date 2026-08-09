import { SkeletonCards, SkeletonHeader, SkeletonScreen, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonHeader />
      <SkeletonCards />
      <SkeletonTable rows={10} columns={6} />
    </SkeletonScreen>
  );
}
