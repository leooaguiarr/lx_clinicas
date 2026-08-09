import { SkeletonCards, SkeletonHeader, SkeletonPanel, SkeletonScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonHeader />
      <SkeletonCards />
      <SkeletonPanel lines={3} className="mt-4" />
    </SkeletonScreen>
  );
}
