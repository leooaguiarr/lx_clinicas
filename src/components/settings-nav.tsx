import Link from "next/link";
const links = [
  ["Clínica", "clinica"],
  ["Profissionais", "profissionais"],
  ["Procedimentos", "procedimentos"],
  ["Convênios", "convenios"],
  ["Usuários", "usuarios"],
  ["Integrações", "integracoes"],
];
export function SettingsNav() {
  return (
    <div className="panel p-2">
      {links.map(([l, h]) => (
        <Link
          key={h}
          className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[#eef5f7] hover:text-[var(--primary)]"
          href={`/configuracoes/${h}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
