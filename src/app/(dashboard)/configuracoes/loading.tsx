import { SkeletonHeader, SkeletonScreen, SkeletonTable } from "@/components/skeletons";

/** Cobre também /configuracoes/[section] — o esqueleto do segmento vale para os filhos. */
export default function Loading() {
  return (
    <SkeletonScreen>
      <SkeletonHeader />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <nav className="panel h-fit p-3">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="mb-1 block h-10 rounded-lg bg-[#e8eef1]" />
          ))}
        </nav>
        <SkeletonTable rows={6} columns={5} />
      </div>
    </SkeletonScreen>
  );
}
