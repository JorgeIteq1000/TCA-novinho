// src/components/Sidebar.tsx
// (Arquivo ajustado, entregando completo conforme solicitado)

// --- MUDANÇA 1: Importar o ícone de 'LogOut' e o 'useAuth' ---
import {
  User,
  FileText,
  Award,
  AlertTriangle,
  ClipboardList,
  Archive,
  School,
  DollarSign,
  BarChart3,
  Settings,
  LogOut, // <-- ADICIONADO
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // <-- ADICIONADO

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "Pessoa", label: "Pessoa", icon: User },
  { id: "Documento", label: "Documento", icon: FileText },
  { id: "Certificado", label: "Certificado", icon: Award },
  { id: "Ocorrência", label: "Ocorrência", icon: AlertTriangle },
  { id: "Nota/Falta", label: "Nota/Falta", icon: ClipboardList },
  { id: "Requerimento", label: "Requerimento", icon: Archive },
  { id: "Matrícula", label: "Matrícula", icon: School },
  { id: "Financeiro", label: "Financeiro", icon: DollarSign },
  { id: "Relatórios", label: "Relatórios", icon: BarChart3 },
  { id: "Configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
}: SidebarProps) {
  // --- MUDANÇA 2: Chamar o hook 'useAuth' ---
  const { logout, user } = useAuth(); // <-- ADICIONADO

  const handleLogout = () => {
    console.log("[Modo Turbo Sidebar] Usuário clicou em Sair.");
    logout();
  };
  // --- FIM DA MUDANÇA 2 ---

  return (
    <aside className="w-64 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] flex flex-col fixed left-0 top-0 h-screen">
      {/* Cabeçalho */}
      <div className="p-6 border-b border-[hsl(var(--sidebar-border))]">
        <h1 className="text-xl font-bold text-[hsl(var(--sidebar-primary-foreground))]">
          Sistema de Consulta
        </h1>
        {/* --- MUDANÇA 3: Mostrar nome do usuário logado --- */}
        {user && (
          <p
            className="text-sm text-[hsl(var(--sidebar-foreground))] opacity-75 truncate mt-1"
            title={user.nome}
          >
            {user.nome}
          </p>
        )}
        {/* --- FIM DA MUDANÇA 3 --- */}
      </div>

      {/* Navegação Principal (ocupa o espaço) */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${
                    isActive
                      ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                      : "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* --- MUDANÇA 4: Rodapé com o botão Sair --- */}
      {/* O 'mt-auto' empurra este bloco para o final do flex-col */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))] mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
      {/* --- FIM DA MUDANÇA 4 --- */}
    </aside>
  );
}
