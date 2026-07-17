
import { 
  LayoutDashboard, 
  Database, 
  Activity, 
  CloudSun, 
  Mountain, 
  AlertTriangle, 
  Binary, 
  Tv, 
  FileText, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
}

export default function Sidebar({ abaAtiva, setAbaAtiva }: SidebarProps) {
  const itensMenu = [
    { id: 'dashboard', nome: 'Painel de Controle', icone: LayoutDashboard },
    { id: 'dataset', nome: 'Base de Dados', icone: Database },
    { id: 'treinamento', nome: 'Treinamento CNN', icone: Activity },
    { id: 'clima', nome: 'Análise Climática', icone: CloudSun },
    { id: 'terreno', nome: 'Análise de Terreno', icone: Mountain },
    { id: 'ep', nome: 'Detecção de EP', icone: AlertTriangle },
    { id: 'fuzzy', nome: 'Sistema Fuzzy', icone: Binary },
    { id: 'tempo_real', nome: 'Monitoramento Real-Time', icone: Tv },
    { id: 'relatorios', nome: 'Relatórios Acadêmicos', icone: FileText },
    { id: 'configuracoes', nome: 'Configurações', icone: Settings },
  ];

  return (
    <aside className="w-64 bg-bgSidebar border-r border-borderColor flex flex-col h-screen sticky top-0 shrink-0 z-30">
      {/* Logotipo / Título da Aplicação */}
      <div className="p-6 border-b border-borderColor flex flex-col gap-1 relative overflow-hidden">
        {/* Holographic line */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-chiralBlue/30 to-transparent" />
        
        <h1 className="text-md font-bold text-chiralBlue tracking-wider font-mono chiral-glow-blue uppercase">
          DS Environment
        </h1>
        <span className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">
          Risk Analyzer
        </span>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {itensMenu.map((item) => {
          const Icone = item.icone;
          const ativo = abaAtiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border-l-2 ${
                ativo
                  ? 'bg-chiralBlue/5 text-chiralBlue border-l-chiralBlue border-y-transparent border-r-transparent shadow-lg shadow-chiralBlue/5'
                  : 'text-textSecondary hover:bg-bgCardHover hover:text-textMain border-l-transparent border-y-transparent border-r-transparent'
              }`}
            >
              <Icone size={16} className={ativo ? 'text-chiralBlue' : 'text-textSecondary'} />
              <span>{item.nome}</span>
            </button>
          );
        })}
      </nav>

      {/* Assinatura / Rodapé */}
      <div className="p-4 border-t border-borderColor text-center bg-bgMain/20 relative">
        <p className="text-[9px] text-textSecondary/70 font-mono uppercase tracking-widest">
          BRIDGES TERMINAL v1.0
        </p>
      </div>
    </aside>
  );
}
