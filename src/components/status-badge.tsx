import { cn } from "@/lib/utils";

const SUCCESS = ["Ativo", "Confirmado", "Pago", "Atendido"];
const DANGER = ["Cancelado", "Faltou", "Em atraso"];
const WARNING = ["Pendente", "Parcial"];

export function StatusBadge({ status }: { status: string }) {
  const variant = SUCCESS.includes(status)
    ? "badge-success"
    : DANGER.includes(status)
      ? "badge-danger"
      : WARNING.includes(status)
        ? "badge-warning"
        : "";
  return <span className={cn("badge", variant)}>{status}</span>;
}
