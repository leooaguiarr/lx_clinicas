import { cn } from "@/lib/utils";
export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Ativo" ||
    status === "Confirmado" ||
    status === "Pago" ||
    status === "Atendido"
      ? "badge-success"
      : status === "Cancelado" || status === "Faltou" || status === "Atrasado"
        ? "badge-danger"
        : status === "Pendente" || status === "Parcial"
          ? "badge-warning"
          : "";
  return <span className={cn("badge", cls)}>{status}</span>;
}
