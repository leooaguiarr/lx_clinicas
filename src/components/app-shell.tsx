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
  const [desktopClosed, setDesktopClosed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // O profissional não enxerga o financeiro (seção 5.3 da SPEC).
  const items = FINANCE_ROLES.includes(session.role) ? nav : nav.filter((item) => item.href !== "/financeiro");

  return (
    <div className={`min-h-screen transition-all duration-300 ${desktopClosed ? "lg:pl-0" : "lg:pl-[236px]"}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-[236px] border-r border-[var(--border)] bg-white p-4 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} ${desktopClosed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}>
        <div className="mb-8 flex h-10 items-center justify-between">
          <Link href="/agenda" className="flex items-center gap-2 font-bold text-[var(--primary)]">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary)] text-white"><Stethoscope size={19} /></span>
            <span>Lx Clínicas</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => (
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
          <p className="text-xs font-semibold">{session.clinicName}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{ROLE_LABEL[session.role]}</p>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 lg:px-7">
        <div className="flex items-center gap-3">
          <button className="button !p-2" onClick={() => window.innerWidth < 1024 ? setOpen(!open) : setDesktopClosed(!desktopClosed)} aria-label="Alternar menu"><Menu size={19} /></button>
          <div className="desktop-only">
            <p className="text-sm font-semibold">{session.clinicName}</p>
            <p className="text-xs muted">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="button relative !p-2" aria-label="Notificações" onClick={() => setNotificationsOpen((v) => !v)} aria-expanded={notificationsOpen} aria-haspopup="menu">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
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
