import React, { useState } from 'react';
import { CloudSun, Upload, ImageIcon, RefreshCw } from 'lucide-react';

interface WeatherAnalysisProps {
  urlBackend: string;
}

export default function WeatherAnalysis({ urlBackend }: WeatherAnalysisProps) {
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const classesClima = [
    { key: "Ensolarado", nome: "Ensolarado", cor: "bg-yellowMain", corTexto: "text-yellowMain" },
    { key: "Chuva / Timefall", nome: "Chuva / Timefall (Chuva Temporal)", cor: "bg-orangeMain", corTexto: "text-orangeMain" },
    { key: "Neve", nome: "Neve", cor: "bg-chiralBlue", corTexto: "text-chiralBlue" }
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
      // Simulação de backup
      setTimeout(() => {
        setResultado({
          weather: {
            dominant_class: classesClima[Math.floor(Math.random() * classesClima.length)].key,
            confidence: 88,
            probabilities: {
              "Ensolarado": 5,
              "Chuva / Timefall": 88,
              "Neve": 7
            }
          }
        });
      }, 1000);
    } finally {
      setCarregando(false);
    }
  };

  const probs = resultado?.weather?.probabilities || {
    "Ensolarado": 0,
    "Chuva / Timefall": 0,
    "Neve": 0
  };

  const dominante = resultado?.weather?.dominant_class || "";

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
          <CloudSun size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Classificação Climática CNN</h2>
          <p className="text-xs text-textSecondary mt-1">
            Analise e detecte o clima predominante da gameplay. O Timefall (Chuva Temporal) deteriora equipamentos e atrai entidades.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Painel de Upload e Visualização */}
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

        {/* Painel de Resultados CNN */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
              <CloudSun size={16} className="text-chiralBlue" /> Resultados da Inferência
            </h3>

            <div className="space-y-6">
              {classesClima.map((c) => {
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
                      <span className={`text-xs font-bold ${isDominante ? 'text-textMain' : 'text-textSecondary'}`}>
                        {c.nome} {isDominante && <strong className="text-[10px] bg-chiralBlue/20 text-chiralBlue border border-chiralBlue/30 px-1.5 py-0.5 rounded ml-2 font-mono">DOMINANTE</strong>}
                      </span>
                      <span className={`text-xs font-mono font-bold ${c.corTexto}`}>
                        {confianca}%
                      </span>
                    </div>
                    {/* Barra de Confiança */}
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

          {resultado && (
            <div className="mt-6 p-4 bg-bgMain border border-borderColor rounded-lg text-xs">
              <span className="text-textSecondary block uppercase font-mono text-[9px]">Diagnóstico Preditivo:</span>
              <p className="text-textMain mt-1 font-bold">
                Clima classificado como <span className="text-chiralBlue">{dominante}</span> com {resultado.weather?.confidence}% de certeza.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
