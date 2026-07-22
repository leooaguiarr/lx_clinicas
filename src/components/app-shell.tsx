"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Settings,
  Users,
  WalletCards,
  BarChart3,
  X,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
const nav = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-[236px]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[236px] border-r border-[var(--border)] bg-white p-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex h-10 items-center justify-between">
          <Link
            href="/agenda"
            className="flex items-center gap-2 font-bold text-[var(--primary)]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary)] text-white">
              <Stethoscope size={19} />
            </span>
            <span>Lx Clínicas</span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${path.startsWith(href) ? "bg-[#eaf3f6] text-[var(--primary)]" : "text-[#526672] hover:bg-[#f5f8fa]"}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-semibold">Clínica Sorriso</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Unidade Centro
          </p>
        </div>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            className="button !p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={19} />
          </button>
          <div className="desktop-only">
            <p className="text-sm font-semibold">Clínica Sorriso</p>
            <p className="text-xs muted">Terça-feira, 21 de julho</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="button relative !p-2" aria-label="Notificações">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
          </button>
          <button className="button">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcecef] text-xs text-[var(--primary)]">
              MA
            </span>
            <span className="desktop-only">Marina Alves</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>
      <main className="p-4 lg:p-7">{children}</main>
    </div>
  );
}
