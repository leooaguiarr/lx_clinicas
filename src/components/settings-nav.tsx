import Link from "next/link";

const links = [
  ["Clínica", "clinica"],
  ["Plano & Assinatura", "plano"],
  ["Profissionais", "profissionais"],
  ["Procedimentos", "procedimentos"],
  ["Convênios", "convenios"],
  ["Usuários", "usuarios"],
  ["Integrações", "integracoes"],
];

export function SettingsNav() {
  return (
    <div className="panel p-2">
      {links.map(([label, href]) => (
        <Link
          key={href}
          className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[#eef5f7] hover:text-[var(--primary)]"
          href={`/configuracoes/${href}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

