import { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Volume2 } from 'lucide-react';

interface SettingsProps {
  urlBackend: string;
  setUrlBackend: (url: string) => void;
}

export default function Settings({ urlBackend, setUrlBackend }: SettingsProps) {
  const [inputUrl, setInputUrl] = useState(urlBackend);
  const [frequencia, setFrequencia] = useState(1);
  const [somOdradek, setSomOdradek] = useState(true);
  const [notificacoes, setNotificacoes] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);

    setTimeout(() => {
      setUrlBackend(inputUrl);
      setSalvando(false);
      setMsg("Configurações atualizadas com sucesso!");
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Configurações do Sistema</h2>
          <p className="text-xs text-textSecondary mt-1">
            Configure portas de comunicação com a API Python e parametrizações operacionais do Odradek.
          </p>
        </div>
      </div>

      {/* Formulário de Configurações */}
      <form onSubmit={handleSalvar} className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
        <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
          <SettingsIcon size={16} className="text-chiralBlue" /> Conectividade & Áudio
        </h3>

        {/* URL do Backend */}
        <div>
          <label className="text-[10px] text-textSecondary uppercase font-mono font-bold">Endereço da API Backend (FastAPI)</label>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full bg-bgMain border border-borderColor text-sm text-textMain px-3 py-2.5 rounded-lg focus:outline-none focus:border-chiralBlue focus:ring-1 focus:ring-chiralBlue/20 mt-1.5 font-mono"
            placeholder="http://localhost:8000"
          />
        </div>

        {/* Frequência de Captura */}
        <div>
          <label className="text-[10px] text-textSecondary uppercase font-mono font-bold">Frequência de Captura de Frames: {frequencia}s</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={frequencia}
            onChange={(e) => setFrequencia(Number(e.target.value))}
            className="w-full accent-chiralBlue bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer mt-2"
          />
          <span className="text-[9px] text-textSecondary font-mono block mt-1">
            Período de processamento da imagem em segundos. Recomendado: 1.0s para análise em tempo real balanceada.
          </span>
        </div>

        {/* Toggles de Recursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Som Odradek */}
          <label className="flex items-center gap-3 p-4 bg-bgMain/20 border border-borderColor rounded-lg cursor-pointer hover:border-chiralBlue/30 transition-all select-none">
            <input
              type="checkbox"
              checked={somOdradek}
              onChange={() => setSomOdradek(!somOdradek)}
              className="accent-chiralBlue"
            />
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-chiralBlue" />
              <div>
                <span className="text-xs font-bold text-textMain block">Alertas Sonoros Odradek</span>
                <span className="text-[9px] text-textSecondary">Ativa bipes ao se aproximar de EPs</span>
              </div>
            </div>
          </label>

          {/* Notificações */}
          <label className="flex items-center gap-3 p-4 bg-bgMain/20 border border-borderColor rounded-lg cursor-pointer hover:border-chiralBlue/30 transition-all select-none">
            <input
              type="checkbox"
              checked={notificacoes}
              onChange={() => setNotificacoes(!notificacoes)}
              className="accent-chiralBlue"
            />
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-chiralBlue" />
              <div>
                <span className="text-xs font-bold text-textMain block">Notificações Críticas</span>
                <span className="text-[9px] text-textSecondary">Avisar quando o nível de risco for Crítico</span>
              </div>
            </div>
          </label>
        </div>

        {msg && (
          <div className="p-3 bg-greenMain/10 border border-greenMain/20 text-greenMain rounded-lg text-xs font-mono text-center">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-chiralBlue/10 hover:bg-chiralBlue/20 text-chiralBlue border border-chiralBlue/30 text-xs font-mono font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-30"
        >
          {salvando ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          SALVAR CONFIGURAÇÕES
        </button>
      </form>
    </div>
  );
}
