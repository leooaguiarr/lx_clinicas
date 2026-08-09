"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, CalendarDays, ChevronDown, LogOut, Menu, Settings, Users, WalletCards, X, Stethoscope } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/actions/auth";
import { FINANCE_ROLES, ROLE_LABEL } from "@/lib/domain";
import type { SessionContext } from "@/lib/auth/session";

const nav = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ session, today, children }: { session: SessionContext; today: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // O profissional não enxerga o financeiro (seção 5.3 da SPEC).
  const items = FINANCE_ROLES.includes(session.role) ? nav : nav.filter((item) => item.href !== "/financeiro");

  // TODO: Implementar lógica real de notificações
  const hasNotifications = false;

  /*
   * `collapsed` só vale no desktop: a barra encolhe para uma faixa de ícones em
   * vez de sair da tela. No celular ela continua sendo uma gaveta (`open`), e por
   * isso todas as classes de recolhimento são prefixadas com `lg:` — o conteúdo
   * textual segue visível na gaveta.
   */
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

  return (
    <div className={`min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[236px]"}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-[var(--border)] bg-white p-4 transition-all duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[236px]"}`}
      >
        <div className={`mb-2 flex h-9 items-center ${collapsed ? "lg:justify-center" : "justify-end"}`}>
          {/*
            O invólucro é quem esconde/mostra: a classe .button do globals.css fica
            fora de @layer e por isso ganha de qualquer utility de display aplicada
            ao próprio botão.
          */}
          <span className="hidden lg:block">
            <button
              className="button !p-2"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!collapsed}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              <Menu size={18} />
            </button>
          </span>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>

        <Link
          href="/agenda"
          className={`mb-7 flex h-10 items-center gap-2 font-bold text-[var(--primary)] ${collapsed ? "lg:justify-center" : ""}`}
          title={collapsed ? "Lx Clínicas" : undefined}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-white"><Stethoscope size={19} /></span>
          <span className={`whitespace-nowrap ${hideWhenCollapsed}`}>Lx Clínicas</span>
        </Link>

        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${collapsed ? "lg:justify-center lg:px-0" : ""} ${path.startsWith(href) ? "bg-[#eaf3f6] text-[var(--primary)]" : "text-[#526672] hover:bg-[#f5f8fa]"}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className={`whitespace-nowrap ${hideWhenCollapsed}`}>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={`mt-auto border-t border-[var(--border)] pt-4 ${hideWhenCollapsed}`}>
          <p className="truncate text-xs font-semibold">{session.clinicName}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{ROLE_LABEL[session.role]}</p>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 lg:px-7">
        <div className="flex items-center gap-3">
          {/* No desktop o controle da barra vive dentro dela; aqui é só a gaveta do celular. */}
          <span className="lg:hidden">
            <button className="button !p-2" onClick={() => setOpen(!open)} aria-label="Abrir menu"><Menu size={19} /></button>
          </span>
          <div className="desktop-only">
            <p className="text-sm font-semibold">{session.clinicName}</p>
            <p className="text-xs muted">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="button relative !p-2" aria-label="Notificações" onClick={() => setNotificationsOpen((v) => !v)} aria-expanded={notificationsOpen} aria-haspopup="menu">
              <Bell size={18} />
              {hasNotifications && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />}
            </button>
            {notificationsOpen && (
              <>
                <button className="fixed inset-0 z-30" aria-label="Fechar notificações" onClick={() => setNotificationsOpen(false)} />
                <div role="menu" className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-[var(--border)] bg-white shadow-[0_8px_24px_rgba(23,43,58,.1)] overflow-hidden">
                  <div className="border-b border-[var(--border)] px-4 py-3 bg-[#fbfcfd]">
                    <p className="text-sm font-semibold">Notificações</p>
                  </div>
                  <div className="p-6 text-center text-sm muted">
                    Você não tem novas notificações.
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button className="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcecef] text-xs text-[var(--primary)]">{session.initials}</span>
              <span className="desktop-only">{session.fullName}</span>
              <ChevronDown size={14} />
            </button>
            {menu && (
              <>
                <button className="fixed inset-0 z-30" aria-label="Fechar menu do usuário" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-[var(--border)] bg-white p-1 shadow-[0_8px_24px_rgba(23,43,58,.1)]">
                  <div className="border-b border-[var(--border)] px-3 py-2">
                    <p className="truncate text-sm font-semibold">{session.fullName}</p>
                    <p className="truncate text-xs muted">{session.email}</p>
                  </div>
                  <form action={signOut}>
                    <button type="submit" role="menuitem" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-[#f5f8fa]">
                      <LogOut size={15} />
                      Sair
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-7">{children}</main>
    </div>
  );
}
