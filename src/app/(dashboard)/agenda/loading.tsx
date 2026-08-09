import { SkeletonAgenda, SkeletonCards, SkeletonHeader, SkeletonScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonHeader withAction />
      <SkeletonCards />
      <SkeletonAgenda />
    </SkeletonScreen>
  );
}
