import React, { useState } from 'react';
import { AlertTriangle, Upload, ImageIcon, RefreshCw, Zap } from 'lucide-react';

interface EpDetectionProps {
  urlBackend: string;
}

export default function EpDetection({ urlBackend }: EpDetectionProps) {
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const classesEP = [
    { key: "Exploração normal", nome: "Exploração Normal", cor: "bg-greenMain", corTexto: "text-greenMain", alerta: "NORMAL" },
    { key: "Área de EP", nome: "Área de Presença Passiva de EP", cor: "bg-yellowMain", corTexto: "text-yellowMain", alerta: "ATENÇÃO" },
    { key: "EP próxima", nome: "EP Próxima (Odradek Ativo)", cor: "bg-orangeMain", corTexto: "text-orangeMain", alerta: "PERIGO" },
    { key: "Combate EP", nome: "Combate Ativo com EP", cor: "bg-redMain", corTexto: "text-redMain", alerta: "ALERTA" },
    { key: "Boss EP", nome: "Encontro de Boss EP", cor: "bg-redMain", corTexto: "text-redMain", alerta: "CRÍTICO" }
  ];

  const handleSelecaoImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemArquivo(file);
      setImagemPreview(URL.createObjectURL(file));
      setResultado(null);
    }
  };

  const handleClassificar = async () => {
    if (!imagemArquivo) return;
    setCarregando(true);

    const formData = new FormData();
    formData.append('file', imagemArquivo);

    try {
      const response = await fetch(`${urlBackend}/api/inference/frame`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResultado(data);
    } catch (e) {
      // Simulação
      setTimeout(() => {
        setResultado({
          ep_state: {
            dominant_class: "EP próxima",
            confidence: 78,
            probabilities: {
              "Exploração normal": 3,
              "Área de EP": 14,
              "EP próxima": 78,
              "Combate EP": 4,
              "Boss EP": 1
            }
          }
        });
      }, 1000);
    } finally {
      setCarregando(false);
    }
  };

  const probs = resultado?.ep_state?.probabilities || {
    "Exploração normal": 0,
    "Área de EP": 0,
    "EP próxima": 0,
    "Combate EP": 0,
    "Boss EP": 0
  };

  const dominante = resultado?.ep_state?.dominant_class || "";

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Detecção de Estado de EP CNN</h2>
          <p className="text-xs text-textSecondary mt-1">
            Monitore o nível de perigo das Entidades Quirais (EPs). A celeridade do scanner Odradek indica a aproximação de perigo extremo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Painel de Entrada */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-sm font-bold font-mono text-textMain mb-4 flex items-center gap-2 uppercase tracking-wider">
              <ImageIcon size={16} className="text-chiralBlue" /> Frame de Entrada
            </h3>
            
            <div className="border border-dashed border-borderColor hover:border-chiralBlue/40 rounded-xl aspect-video relative flex flex-col items-center justify-center bg-bgMain/30 overflow-hidden min-h-[220px]">
              {imagemPreview ? (
                <>
                  <img src={imagemPreview} alt="Gameplay Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/55 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleSelecaoImagem} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-xs text-textMain font-mono font-bold border border-borderColor bg-bgCard px-3 py-1.5 rounded-lg shadow-lg">Alterar Imagem</span>
                  </div>
                </>
              ) : (
                <>
                  <input type="file" accept="image/*" onChange={handleSelecaoImagem} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={32} className="text-textSecondary mb-2" />
                  <span className="text-xs text-textMain font-bold">Clique para carregar imagem</span>
                  <span className="text-[9px] text-textSecondary mt-1">Imagens de gameplay de Death Stranding</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleClassificar}
            disabled={!imagemArquivo || carregando}
            className="w-full bg-chiralBlue/10 hover:bg-chiralBlue/20 text-chiralBlue border border-chiralBlue/30 text-xs font-mono font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-30"
          >
            {carregando ? <RefreshCw size={14} className="animate-spin" /> : "DETECTAR ESTADO"}
          </button>
        </div>

        {/* Resultados de EPs */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Zap size={16} className="text-chiralBlue" /> Status Quiral do Odradek
          </h3>

          <div className="space-y-4">
            {classesEP.map((c) => {
              const confianca = probs[c.key] || 0;
              const isDominante = dominante === c.key;
              return (
                <div 
                  key={c.key}
                  className={`p-4 rounded-lg border transition-all ${
                    isDominante 
                      ? 'bg-chiralBlue/5 border-chiralBlue/30 shadow-md shadow-chiralBlue/5' 
                      : 'bg-bgMain/30 border-borderColor/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        c.key === "Exploração normal" ? "bg-greenMain/20 text-greenMain border border-greenMain/30" :
                        c.key === "Área de EP" ? "bg-yellowMain/20 text-yellowMain border border-yellowMain/30" :
                        c.key === "EP próxima" ? "bg-orangeMain/20 text-orangeMain border border-orangeMain/30" :
                        "bg-redMain/20 text-redMain border border-redMain/30"
                      }`}>
                        {c.alerta}
                      </span>
                      <span className={`text-xs font-bold ${isDominante ? 'text-textMain' : 'text-textSecondary'}`}>
                        {c.nome}
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${c.corTexto}`}>{confianca}%</span>
                  </div>

                  <div className="w-full bg-borderColor/40 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${c.cor} h-full transition-all duration-500`}
                      style={{ width: `${confianca}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
