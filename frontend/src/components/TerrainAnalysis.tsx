import React, { useState } from 'react';
import { Mountain, Upload, ImageIcon, RefreshCw } from 'lucide-react';

interface TerrainAnalysisProps {
  urlBackend: string;
}

export default function TerrainAnalysis({ urlBackend }: TerrainAnalysisProps) {
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const classesTerreno = [
    { key: "Campo / Vegetação", nome: "Campo / Vegetação", cor: "bg-greenMain" },
    { key: "Rochoso", nome: "Rochoso", cor: "bg-textSecondary" },
    { key: "Montanhoso", nome: "Montanhoso", cor: "bg-yellowMain" },
    { key: "Nevado", nome: "Nevado", cor: "bg-chiralBlue" },
    { key: "Rio / Lago", nome: "Rio / Lago", cor: "bg-chiralBlue" },
    { key: "Área urbana / instalações", nome: "Área urbana / instalações", cor: "bg-textMain" }
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
          terrain: {
            dominant_class: "Montanhoso",
            confidence: 84,
            probabilities: {
              "Campo / Vegetação": 5,
              "Rochoso": 7,
              "Montanhoso": 84,
              "Nevado": 2,
              "Rio / Lago": 1,
              "Área urbana / instalações": 1
            }
          }
        });
      }, 1000);
    } finally {
      setCarregando(false);
    }
  };

  const probs = resultado?.terrain?.probabilities || {
    "Campo / Vegetação": 0,
    "Rochoso": 0,
    "Montanhoso": 0,
    "Nevado": 0,
    "Rio / Lago": 0,
    "Área urbana / instalações": 0
  };

  const dominante = resultado?.terrain?.dominant_class || "";

  // Ordena as classes pelo ranking de probabilidade
  const classesOrdenadas = [...classesTerreno]
    .map(c => ({ ...c, confianca: probs[c.key] || 0 }))
    .sort((a, b) => b.confianca - a.confianca);

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
          <Mountain size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Classificação de Terreno CNN</h2>
          <p className="text-xs text-textSecondary mt-1">
            Mapeie o terreno para prever a dificuldade de travessia. Terrenos rochosos, nevados ou rios oferecem perigo físico ao Sam Bridges.
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
            {carregando ? <RefreshCw size={14} className="animate-spin" /> : "PROCESSAR COM CNN"}
          </button>
        </div>

        {/* Resultados e Ranking */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Mountain size={16} className="text-chiralBlue" /> Ranking de Terreno CNN
          </h3>

          <div className="space-y-4">
            {classesOrdenadas.map((c, index) => {
              const isDominante = dominante === c.key;
              return (
                <div 
                  key={c.key}
                  className={`p-3 rounded-lg border transition-all ${
                    isDominante 
                      ? 'bg-chiralBlue/5 border-chiralBlue/30 shadow-md shadow-chiralBlue/5' 
                      : 'bg-bgMain/30 border-borderColor/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-textSecondary font-mono font-bold">#{index + 1}</span>
                      <span className={`text-xs font-bold ${isDominante ? 'text-textMain font-extrabold' : 'text-textSecondary'}`}>
                        {c.nome}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-textMain">{c.confianca}%</span>
                  </div>

                  <div className="w-full bg-borderColor/40 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${c.cor} h-full transition-all duration-500`}
                      style={{ width: `${c.confianca}%` }}
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
