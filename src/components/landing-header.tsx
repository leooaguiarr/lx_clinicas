"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  Menu,
  Stethoscope,
  User,
  X,
} from "lucide-react";

export function LandingHeader({
  isAuthenticated,
  clinicName,
}: {
  isAuthenticated: boolean;
  clinicName?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-secondary)] text-white shadow-sm">
            <Stethoscope size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
            Lx Clínicas
          </span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#funcionalidades"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
          >
            Funcionalidades
          </a>
          <a
            href="#secretaria-ia"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
          >
            Secretária IA
          </a>
          <a
            href="#planos"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
          >
            Planos
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
          >
            Dúvidas
          </a>
        </nav>

        {/* Ações desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              href="/agenda"
              className="button button-primary !py-2 !px-4 text-xs sm:text-sm font-semibold shadow-sm"
            >
              <LayoutDashboard size={16} />
              Acessar Painel {clinicName ? `(${clinicName})` : ""}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="button !border-[var(--border)] !py-2 !px-4 text-sm font-semibold text-[var(--text-primary)] transition-all hover:!border-[var(--primary)] hover:!text-[var(--primary)]"
              >
                <User size={15} />
                Área do Cliente
              </Link>
              <a
                href="#planos"
                className="button button-primary !py-2 !px-4 text-sm font-semibold shadow-sm"
              >
                Começar agora
                <ArrowRight size={15} />
              </a>
            </>
          )}
        </div>

        {/* Botão menu mobile */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="button !p-2 text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile expansível */}
      {mobileMenuOpen && (
        <div className="border-b border-[var(--border)] bg-white px-4 pt-3 pb-6 md:hidden">
          <nav className="flex flex-col space-y-3">
            <a
              href="#funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[#f8fafc]"
            >
              Funcionalidades
            </a>
            <a
              href="#secretaria-ia"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[#f8fafc]"
            >
              Secretária IA
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[#f8fafc]"
            >
              Planos & Preços
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[#f8fafc]"
            >
              Perguntas Frequentes
            </a>

            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              {isAuthenticated ? (
                <Link
                  href="/agenda"
                  onClick={() => setMobileMenuOpen(false)}
                  className="button button-primary w-full justify-center !py-2.5 font-semibold"
                >
                  <LayoutDashboard size={16} />
                  Acessar Painel
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="button w-full justify-center !py-2.5 font-semibold"
                  >
                    <User size={16} />
                    Área do Cliente (Login)
                  </Link>
                  <a
                    href="#planos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="button button-primary w-full justify-center !py-2.5 font-semibold"
                  >
                    Ver Planos de Assinatura
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
