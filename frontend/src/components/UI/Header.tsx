import { Cpu, Server, CheckCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  apiStatus: 'online' | 'offline';
  modeloTreinado: boolean;
  cpuUso: number;
  gpuNome: string;
}

export default function Header({ 
  abaAtiva,
  setAbaAtiva,
  apiStatus, 
  modeloTreinado, 
  cpuUso, 
  gpuNome
}: HeaderProps) {
  
  const abas = [
    { id: 'dashboard', nome: 'Painel' },
    { id: 'dataset', nome: 'Dataset' },
    { id: 'treinamento', nome: 'Treino' },
    { id: 'clima', nome: 'Clima' },
    { id: 'terreno', nome: 'Terreno' },
    { id: 'ep', nome: 'EP' },
    { id: 'fuzzy', nome: 'Fuzzy' },
    { id: 'tempo_real', nome: 'Tempo Real' },
    { id: 'relatorios', nome: 'Relatórios' },
    { id: 'configuracoes', nome: 'Config' }
  ];

  return (
    <header className="h-16 bg-bgCard border-b border-borderColor px-6 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-md backdrop-blur-md bg-opacity-95 print:hidden">
      {/* Logotipo e Nome do Sistema */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-chiralBlue/10 border border-chiralBlue/30 flex items-center justify-center text-chiralBlue">
          <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '20s' }} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xs font-bold text-textMain tracking-widest font-mono uppercase">
            DS ENVIRONMENT
          </h1>
          <span className="text-[8px] text-textSecondary uppercase tracking-widest font-mono font-bold leading-none -mt-0.5">
            Intelligence
          </span>
        </div>
      </div>

      {/* Navegação por Abas (Centralizada) */}
      <nav className="flex items-center gap-1 bg-bgMain/40 p-1 rounded-lg border border-borderColor/30">
        {abas.map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${
                ativa
                  ? 'bg-chiralBlue text-bgMain shadow-lg shadow-chiralBlue/20 font-extrabold'
                  : 'text-textSecondary hover:text-textMain hover:bg-bgCardHover'
              }`}
            >
              {aba.nome}
            </button>
          );
        })}
      </nav>

      {/* Indicadores compactos e status geral */}
      <div className="flex items-center gap-4 text-[9px] font-mono">
        {/* Indicadores Rápidos Hover */}
        <div className="hidden lg:flex items-center gap-2 text-textSecondary border-r border-borderColor/40 pr-4">
          <div className="flex items-center gap-1" title={`API: ${apiStatus.toUpperCase()}`}>
            <Server size={11} className={apiStatus === 'online' ? 'text-greenMain' : 'text-redMain'} />
          </div>
          <div className="flex items-center gap-1" title={`Modelo: ${modeloTreinado ? 'Carregado' : 'Simulado'}`}>
            <CheckCircle size={11} className={modeloTreinado ? 'text-chiralBlue' : 'text-yellowMain'} />
          </div>
          <div className="flex items-center gap-1" title={`CPU: ${cpuUso}% | GPU: ${gpuNome}`}>
            <Cpu size={11} className="text-textSecondary" />
            <span>{cpuUso}%</span>
          </div>
        </div>

        {/* Status Online Principal */}
        {apiStatus === 'online' ? (
          <div className="flex items-center gap-2 bg-greenMain/10 border border-greenMain/20 px-3 py-1 rounded-full text-greenMain font-bold tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-greenMain animate-ping" />
            <span>SISTEMA ONLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-redMain/10 border border-redMain/20 px-3 py-1 rounded-full text-redMain font-bold tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-redMain" />
            <span>SISTEMA OFFLINE</span>
          </div>
        )}
      </div>
    </header>
  );
}
