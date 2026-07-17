import { useState, useEffect } from 'react';
import { Database, Upload, CheckCircle2, AlertTriangle, Trash2, RotateCcw, HelpCircle, RefreshCw, Sliders } from 'lucide-react';

interface ClassItem {
  class_id: string;
  name: string;
  count: number;
  percentage: number;
  balance_status: string;
  thumbnails: string[];
}

interface DatasetProps {
  datasetStats: {
    total_images: number;
    groups: {
      Clima: ClassItem[];
      Terreno: ClassItem[];
      'Estado EP': ClassItem[];
    };
  };
  recarregarStats: () => void;
  urlBackend: string;
}

export default function Dataset({ datasetStats, recarregarStats, urlBackend }: DatasetProps) {
  const [grupoSelecionado, setGrupoSelecionado] = useState<'climate' | 'terrain' | 'ep_state'>('climate');
  const [classeSelecionada, setClasseSelecionada] = useState<string>('sunny');
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ tipo: 'sucesso' | 'erro' | 'carregando'; msg: string } | null>(null);

  // Estados do módulo de Limpeza de Duplicatas
  const [modoVisualizacao, setModoVisualizacao] = useState<'distribuicao' | 'limpeza'>('distribuicao');
  const [maxCopias, setMaxCopias] = useState<number>(4);
  const [limiarSimilaridade, setLimiarSimilaridade] = useState<number>(4);
  const [analiseResultado, setAnaliseResultado] = useState<any>(null);
  const [backupImagens, setBackupImagens] = useState<string[]>([]);
  const [carregandoAnalise, setCarregandoAnalise] = useState<boolean>(false);
  const [carregandoLimpeza, setCarregandoLimpeza] = useState<boolean>(false);
  const [carregandoRestauracao, setCarregandoRestauracao] = useState<boolean>(false);
  const [mensagemStatus, setMensagemStatus] = useState<{ tipo: 'sucesso' | 'erro' | 'carregando'; msg: string } | null>(null);

  // Carregar lista de imagens removidas (backup)
  const carregarBackup = async (grupo: string, classe: string) => {
    try {
      const res = await fetch(`${urlBackend}/api/dataset/duplicates/backup?grupo=${grupo}&classe=${classe}`);
      if (res.ok) {
        const data = await res.json();
        setBackupImagens(data.imagens || []);
      }
    } catch (error) {
      console.error("Erro ao carregar backup:", error);
    }
  };

  // Rodar a análise de duplicados no backend
  const rodarAnalise = async (grupo: string, classe: string, copias = maxCopias, limiar = limiarSimilaridade) => {
    setCarregandoAnalise(true);
    setMensagemStatus(null);
    try {
      const res = await fetch(`${urlBackend}/api/dataset/duplicates/analyze?grupo=${grupo}&classe=${classe}&max_copias=${copias}&limiar=${limiar}`);
      if (res.ok) {
        const data = await res.json();
        setAnaliseResultado(data);
      } else {
        const err = await res.json();
        setMensagemStatus({ tipo: 'erro', msg: err.detail || 'Erro ao analisar duplicados.' });
      }
    } catch (error) {
      setMensagemStatus({ tipo: 'erro', msg: 'Erro de conexão com o servidor backend.' });
    } finally {
      setCarregandoAnalise(false);
    }
  };

  // Executar a movimentação para backup
  const executarLimpeza = async () => {
    if (!analiseResultado || analiseResultado.total_duplicadas === 0) return;
    setCarregandoLimpeza(true);
    setMensagemStatus({ tipo: 'carregando', msg: 'Movendo imagens duplicadas para backup...' });
    try {
      const formData = new FormData();
      formData.append('grupo', grupoSelecionado);
      formData.append('classe', classeSelecionada);
      formData.append('max_copias', maxCopias.toString());
      formData.append('limiar', limiarSimilaridade.toString());

      const res = await fetch(`${urlBackend}/api/dataset/duplicates/clean`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMensagemStatus({ tipo: 'sucesso', msg: `Limpeza concluída! ${data.total_movidas} imagens movidas para a pasta de backup.` });
        recarregarStats();
        carregarBackup(grupoSelecionado, classeSelecionada);
        rodarAnalise(grupoSelecionado, classeSelecionada);
      } else {
        const err = await res.json();
        setMensagemStatus({ tipo: 'erro', msg: err.detail || 'Erro ao executar limpeza.' });
      }
    } catch (error) {
      setMensagemStatus({ tipo: 'erro', msg: 'Erro ao conectar com o servidor.' });
    } finally {
      setCarregandoLimpeza(false);
    }
  };

  // Restaurar uma imagem ou todas do backup de volta ao dataset ativo
  const restaurarBackup = async (filename: string) => {
    setCarregandoRestauracao(true);
    setMensagemStatus({ tipo: 'carregando', msg: 'Restaurando imagens para o dataset ativo...' });
    try {
      const formData = new FormData();
      formData.append('grupo', grupoSelecionado);
      formData.append('classe', classeSelecionada);
      formData.append('filename', filename);

      const res = await fetch(`${urlBackend}/api/dataset/duplicates/restore`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMensagemStatus({ 
          tipo: 'sucesso', 
          msg: filename === 'all' 
            ? `${data.total_restauradas} imagens restauradas com sucesso!` 
            : `Imagem restaurada com sucesso!` 
        });
        recarregarStats();
        carregarBackup(grupoSelecionado, classeSelecionada);
        rodarAnalise(grupoSelecionado, classeSelecionada);
      } else {
        const err = await res.json();
        setMensagemStatus({ tipo: 'erro', msg: err.detail || 'Erro ao restaurar imagens.' });
      }
    } catch (error) {
      setMensagemStatus({ tipo: 'erro', msg: 'Erro de conexão com o servidor.' });
    } finally {
      setCarregandoRestauracao(false);
    }
  };

  // Efeito para carregar dados automaticamente ao entrar na tela de limpeza ou mudar de classe
  useEffect(() => {
    if (modoVisualizacao === 'limpeza') {
      carregarBackup(grupoSelecionado, classeSelecionada);
      rodarAnalise(grupoSelecionado, classeSelecionada);
    }
  }, [grupoSelecionado, classeSelecionada, modoVisualizacao]);

  // Mapeamento para visualização das abas em português
  const abasGrupos = [
    { id: 'climate', nome: 'Clima', keyF: 'Clima' },
    { id: 'terrain', nome: 'Terreno', keyF: 'Terreno' },
    { id: 'ep_state', nome: 'Estado EP', keyF: 'Estado EP' }
  ];

  // Tradução de classes internas do select
  const classesPorGrupo = {
    climate: [
      { id: 'sunny', nome: 'Ensolarado' },
      { id: 'rain', nome: 'Chuva / Timefall' },
      { id: 'snow', nome: 'Neve' }
    ],
    terrain: [
      { id: 'vegetation', nome: 'Campo / Vegetação' },
      { id: 'rocky', nome: 'Rochoso' },
      { id: 'mountainous', nome: 'Montanhoso' },
      { id: 'snowy', nome: 'Nevado' },
      { id: 'water', nome: 'Rio / Lago' },
      { id: 'urban', nome: 'Área urbana / instalações' }
    ],
    ep_state: [
      { id: 'normal', nome: 'Exploração normal' },
      { id: 'ep_area', nome: 'Área de EP' },
      { id: 'ep_near', nome: 'EP próxima' },
      { id: 'ep_combat', nome: 'Combate EP' },
      { id: 'ep_boss', nome: 'Boss EP' }
    ]
  };

  const handleMudarGrupo = (grupo: 'climate' | 'terrain' | 'ep_state') => {
    setGrupoSelecionado(grupo);
    setClasseSelecionada(classesPorGrupo[grupo][0].id);
  };

  const handleFileChange = (file: File | null) => {
    setArquivoUpload(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoUpload) return;

    setUploadStatus({ tipo: 'carregando', msg: 'Enviando imagem ao servidor...' });

    const formData = new FormData();
    formData.append('grupo', grupoSelecionado);
    formData.append('classe', classeSelecionada);
    formData.append('file', arquivoUpload);

    try {
      const response = await fetch(`${urlBackend}/api/dataset/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus({ tipo: 'sucesso', msg: 'Imagem enviada e integrada ao dataset com sucesso!' });
        setArquivoUpload(null);
        setImagePreview(null);
        recarregarStats(); // Recarregar estatísticas
      } else {
        const errorData = await response.json();
        setUploadStatus({ tipo: 'erro', msg: errorData.detail || 'Erro ao enviar a imagem.' });
      }
    } catch (error) {
      setUploadStatus({ tipo: 'erro', msg: 'Sem conexão com a API. Salvando apenas no protótipo.' });
      // Simulação no protótipo se estiver offline
      setTimeout(() => {
        setUploadStatus({ tipo: 'sucesso', msg: 'Simulação: Imagem registrada no dataset do protótipo.' });
        setArquivoUpload(null);
        setImagePreview(null);
      }, 1000);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Balanceado':
        return <span className="bg-greenMain/10 text-greenMain text-[10px] px-2 py-0.5 rounded-full border border-greenMain/20 font-mono">BALANCEADO</span>;
      case 'Sobrecarregado':
        return <span className="bg-redMain/10 text-redMain text-[10px] px-2 py-0.5 rounded-full border border-redMain/20 font-mono">EXCESSO</span>;
      case 'Insuficiente':
        return <span className="bg-yellowMain/10 text-yellowMain text-[10px] px-2 py-0.5 rounded-full border border-yellowMain/20 font-mono">INSUFICIENTE</span>;
      case 'Poucos dados':
        return <span className="bg-orangeMain/10 text-orangeMain text-[10px] px-2 py-0.5 rounded-full border border-orangeMain/20 font-mono">POUCOS DADOS</span>;
      default:
        return <span className="bg-borderColor/50 text-textSecondary text-[10px] px-2 py-0.5 rounded-full border border-borderColor font-mono">VAZIO</span>;
    }
  };

  const grupoNomeF = abasGrupos.find(a => a.id === grupoSelecionado)?.keyF || 'Clima';
  const classesAtivas = datasetStats?.groups?.[grupoNomeF as keyof typeof datasetStats.groups] || [];

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blueMain/10 text-blueMain rounded-xl border border-blueMain/20">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Gerenciador de Datasets</h2>
            <p className="text-xs text-textSecondary mt-1">
              Visualize a distribuição do seu dataset acadêmico. Total de imagens carregadas: <strong className="text-textMain font-mono font-bold">{datasetStats?.total_images || 342}</strong>
            </p>
          </div>
        </div>

        {/* Abas de Grupo */}
        <div className="flex bg-bgMain border border-borderColor p-1 rounded-lg">
          {abasGrupos.map((aba) => (
            <button
              key={aba.id}
              onClick={() => handleMudarGrupo(aba.id as any)}
              className={`px-4 py-2 rounded-md text-xs font-mono font-medium transition-all ${
                grupoSelecionado === aba.id
                  ? 'bg-chiralBlue/10 text-chiralBlue border border-chiralBlue/20 shadow-sm'
                  : 'text-textSecondary hover:text-textMain border border-transparent'
              }`}
            >
              {aba.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Abas de Modo de Visualização */}
      <div className="flex gap-6 border-b border-borderColor pb-1 mt-4">
        <button
          onClick={() => setModoVisualizacao('distribuicao')}
          className={`pb-3 px-1 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            modoVisualizacao === 'distribuicao'
              ? 'border-chiralBlue text-chiralBlue'
              : 'border-transparent text-textSecondary hover:text-textMain'
          }`}
        >
          Distribuição & Upload
        </button>
        <button
          onClick={() => setModoVisualizacao('limpeza')}
          className={`pb-3 px-1 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            modoVisualizacao === 'limpeza'
              ? 'border-chiralBlue text-chiralBlue'
              : 'border-transparent text-textSecondary hover:text-textMain'
          }`}
        >
          Limpeza de Duplicados
        </button>
      </div>

      {modoVisualizacao === 'limpeza' ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Configurações & Ações */}
          <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-textMain uppercase tracking-wider">Configuração da Limpeza</h3>
                <p className="text-xs text-textSecondary mt-1">
                  Selecione a classe e ajuste os parâmetros para agrupar e limpar imagens duplicadas.
                </p>
              </div>

              {/* Controles de Grupo e Classe Rápidos */}
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <div className="w-full sm:w-auto">
                  <select
                    value={grupoSelecionado}
                    onChange={(e) => handleMudarGrupo(e.target.value as any)}
                    className="w-full sm:w-48 bg-bgMain border border-borderColor text-xs text-textMain px-3 py-2 rounded-lg focus:outline-none focus:border-chiralBlue font-mono"
                  >
                    <option value="climate">Clima (Weather)</option>
                    <option value="terrain">Terrain (Terreno)</option>
                    <option value="ep_state">EP State (Estado EP)</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={classeSelecionada}
                    onChange={(e) => setClasseSelecionada(e.target.value)}
                    className="w-full sm:w-48 bg-bgMain border border-borderColor text-xs text-textMain px-3 py-2 rounded-lg focus:outline-none focus:border-chiralBlue font-mono"
                  >
                    {classesPorGrupo[grupoSelecionado].map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-borderColor pt-6">
              {/* Sliders de Ajuste */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono font-medium text-textMain">
                    <span className="flex items-center gap-1"><Sliders size={14} className="text-chiralBlue" /> CÓPIAS A MANTER: {maxCopias}</span>
                    <span className="text-textSecondary">Padrão: 4</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxCopias}
                    onChange={(e) => setMaxCopias(parseInt(e.target.value))}
                    className="w-full mt-2 accent-chiralBlue bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-textSecondary mt-1">
                    Número de cópias semelhantes que serão mantidas ativas no dataset como backup visual.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-medium text-textMain">
                    <span className="flex items-center gap-1"><Sliders size={14} className="text-chiralBlue" /> LIMIAR DE DIFERENÇA (BITS): {limiarSimilaridade}</span>
                    <span className="text-textSecondary">Padrão: 4</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={limiarSimilaridade}
                    onChange={(e) => setLimiarSimilaridade(parseInt(e.target.value))}
                    className="w-full mt-2 accent-chiralBlue bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-textSecondary mt-1">
                    Quanto menor o número, mais idênticas as imagens precisam ser para serem agrupadas (4 é ótimo para frames de vídeo).
                  </p>
                </div>
              </div>

              {/* Botões de Ação Principal */}
              <div className="flex flex-col justify-end gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => rodarAnalise(grupoSelecionado, classeSelecionada)}
                    disabled={carregandoAnalise}
                    className="flex-1 bg-bgMain hover:bg-bgMain/80 text-textMain border border-borderColor text-xs font-mono py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={carregandoAnalise ? "animate-spin text-chiralBlue" : "text-chiralBlue"} />
                    {carregandoAnalise ? "Analisando..." : "Atualizar Análise"}
                  </button>

                  <button
                    onClick={executarLimpeza}
                    disabled={carregandoLimpeza || !analiseResultado || analiseResultado.total_duplicadas === 0}
                    className="flex-1 bg-redMain/10 hover:bg-redMain/20 text-redMain border border-redMain/30 text-xs font-mono font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    {carregandoLimpeza ? "Limpando..." : "Mover Duplicados para Backup"}
                  </button>
                </div>

                {mensagemStatus && (
                  <div className={`p-3 rounded-lg text-xs flex gap-2 border items-center ${
                    mensagemStatus.tipo === 'sucesso'
                      ? 'bg-greenMain/10 border-greenMain/20 text-greenMain'
                      : mensagemStatus.tipo === 'erro'
                      ? 'bg-redMain/10 border-redMain/20 text-redMain'
                      : 'bg-borderColor/30 border-borderColor text-textSecondary'
                  }`}>
                    {mensagemStatus.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{mensagemStatus.msg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards de Métricas da Classe Ativa */}
          {analiseResultado && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-bgCard border border-borderColor p-4 rounded-xl shadow shadow-black/10 font-mono">
                <div className="text-[10px] text-textSecondary uppercase font-bold">Total de Imagens na Classe</div>
                <div className="text-2xl font-bold text-textMain mt-1">{analiseResultado.total_imagens}</div>
              </div>
              <div className="bg-bgCard border border-borderColor p-4 rounded-xl shadow shadow-black/10 font-mono">
                <div className="text-[10px] text-textSecondary uppercase font-bold text-greenMain">Imagens Mantidas</div>
                <div className="text-2xl font-bold text-greenMain mt-1">{analiseResultado.total_mantidas}</div>
              </div>
              <div className="bg-bgCard border border-borderColor p-4 rounded-xl shadow shadow-black/10 font-mono">
                <div className="text-[10px] text-textSecondary uppercase font-bold text-redMain">Imagens Duplicadas (Excedentes)</div>
                <div className="text-2xl font-bold text-redMain mt-1">{analiseResultado.total_duplicadas}</div>
              </div>
            </div>
          )}

          {/* Visualizador de Grupos de Duplicados */}
          <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg space-y-6">
            <h3 className="text-sm font-bold font-mono text-textMain border-b border-borderColor pb-4 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={16} className="text-chiralBlue" /> Grupos de Imagens Semelhantes Detectados
            </h3>

            {carregandoAnalise ? (
              <div className="py-12 text-center text-textSecondary font-mono text-xs flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-chiralBlue" />
                Processando hashes e comparando similaridades de imagem...
              </div>
            ) : analiseResultado?.grupos && analiseResultado.grupos.length > 0 ? (
              <div className="space-y-8">
                {analiseResultado.grupos.map((grupo: any) => (
                  <div key={grupo.grupo_id} className="border border-borderColor/60 rounded-xl overflow-hidden bg-bgMain/10">
                    {/* Header do Grupo */}
                    <div className="bg-bgMain/50 border-b border-borderColor px-4 py-3 flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-textMain uppercase tracking-wider">
                        Grupo #{grupo.grupo_id + 1}
                      </span>
                      <span className="text-[10px] font-mono text-textSecondary">
                        Semelhantes encontradas: {grupo.kept.length + grupo.duplicates.length}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Sub-grid 1: Imagens que serão MANTIDAS */}
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-wider text-greenMain font-bold mb-2">
                          Imagens Mantidas (Máximo {maxCopias}):
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {grupo.kept.map((imgName: string, i: number) => (
                            <div key={i} className="group relative aspect-video bg-bgMain border-2 border-greenMain/30 hover:border-greenMain/60 rounded-lg overflow-hidden flex flex-col justify-between shadow transition-all">
                              <img
                                src={`${urlBackend}/dataset/${grupoSelecionado}/${classeSelecionada}/${imgName}`}
                                alt="Keep sample"
                                className="w-full h-full object-cover flex-1"
                              />
                              <div className="bg-greenMain/90 text-bgCard text-[8px] font-mono font-bold text-center py-1 uppercase tracking-wider">
                                Mantida ({i + 1})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sub-grid 2: Imagens que serão DUPLICADAS */}
                      {grupo.duplicates.length > 0 && (
                        <div className="border-t border-borderColor/30 pt-4">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-redMain font-bold mb-2">
                            Imagens Duplicadas (Excedentes - Serão Movidas):
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {grupo.duplicates.map((imgName: string, i: number) => (
                              <div key={i} className="group relative aspect-video bg-bgMain border-2 border-redMain/30 hover:border-redMain/60 rounded-lg overflow-hidden flex flex-col justify-between shadow transition-all">
                                <img
                                  src={`${urlBackend}/dataset/${grupoSelecionado}/${classeSelecionada}/${imgName}`}
                                  alt="Duplicate sample"
                                  className="w-full h-full object-cover flex-1 filter brightness-75"
                                />
                                <div className="bg-redMain/90 text-textMain text-[8px] font-mono font-bold text-center py-1 uppercase tracking-wider flex items-center justify-center gap-1">
                                  <Trash2 size={8} /> Remover
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-textSecondary font-mono text-xs">
                Nenhuma imagem duplicada ou excessivamente semelhante foi encontrada nesta classe com os parâmetros atuais.
              </div>
            )}
          </div>

          {/* Galeria de Backup (Imagens Removidas) */}
          <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-borderColor pb-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-textMain uppercase tracking-wider">
                  Imagens Removidas (Backup)
                </h3>
                <p className="text-xs text-textSecondary mt-1">
                  Imagens movidas para backup desta classe. Você pode restaurá-las a qualquer momento.
                </p>
              </div>

              {backupImagens.length > 0 && (
                <button
                  onClick={() => restaurarBackup('all')}
                  disabled={carregandoRestauracao}
                  className="bg-chiralBlue/10 hover:bg-chiralBlue/20 text-chiralBlue border border-chiralBlue/30 text-xs font-mono font-bold py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RotateCcw size={14} className={carregandoRestauracao ? "animate-spin" : ""} />
                  Restaurar Todas
                </button>
              )}
            </div>

            {backupImagens.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {backupImagens.map((imgName: string, i: number) => (
                  <div key={i} className="group relative aspect-video bg-bgMain border border-borderColor rounded-lg overflow-hidden flex flex-col shadow hover:shadow-md transition-all">
                    <img
                      src={`${urlBackend}/removed_images/${grupoSelecionado}/${classeSelecionada}/${imgName}`}
                      alt="Backup sample"
                      className="w-full h-full object-cover flex-1"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                      }}
                    />
                    <button
                      onClick={() => restaurarBackup(imgName)}
                      disabled={carregandoRestauracao}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border border-transparent font-mono text-[10px] text-textMain"
                    >
                      <RotateCcw size={18} className="text-chiralBlue" />
                      Restaurar
                    </button>
                    <div className="bg-bgCard text-[9px] font-mono text-textSecondary px-2 py-1 text-center truncate select-all" title={imgName}>
                      {imgName.substring(0, 12)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-textSecondary font-mono text-xs border border-dashed border-borderColor rounded-xl">
                Nenhuma imagem de backup encontrada para esta classe.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload de Imagens no Dataset */}
          <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider">
                <Upload size={16} className="text-chiralBlue" /> Alimentar Dataset
              </h3>
              
              <form onSubmit={handleUpload} className="space-y-4">
                {/* Seleção de Grupo */}
                <div>
                  <label className="text-[10px] text-textSecondary uppercase font-mono font-bold">Grupo de IA</label>
                  <select
                    value={grupoSelecionado}
                    onChange={(e) => handleMudarGrupo(e.target.value as any)}
                    className="w-full bg-bgMain border border-borderColor text-sm text-textMain px-3 py-2.5 rounded-lg focus:outline-none focus:border-chiralBlue focus:ring-1 focus:ring-chiralBlue/20 mt-1.5 font-mono"
                  >
                    <option value="climate">Clima (Weather)</option>
                    <option value="terrain">Terreno (Terrain)</option>
                    <option value="ep_state">Estado de EP (EP State)</option>
                  </select>
                </div>

                {/* Seleção de Classe */}
                <div>
                  <label className="text-[10px] text-textSecondary uppercase font-mono font-bold">Classe de Classificação</label>
                  <select
                    value={classeSelecionada}
                    onChange={(e) => setClasseSelecionada(e.target.value)}
                    className="w-full bg-bgMain border border-borderColor text-sm text-textMain px-3 py-2.5 rounded-lg focus:outline-none focus:border-chiralBlue focus:ring-1 focus:ring-chiralBlue/20 mt-1.5 font-mono"
                  >
                    {classesPorGrupo[grupoSelecionado].map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Upload de Arquivo */}
                <div>
                  <label className="text-[10px] text-textSecondary uppercase font-mono font-bold">Imagem de Gameplay</label>
                  <div className="border border-dashed border-borderColor hover:border-chiralBlue/50 rounded-lg p-6 mt-1.5 text-center transition-all cursor-pointer relative bg-bgMain/50 min-h-[140px] flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="w-full h-24 relative overflow-hidden rounded border border-borderColor flex items-center justify-center">
                        <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-textSecondary mb-2" />
                        <span className="text-xs text-textMain block font-medium">
                          Clique ou arraste um arquivo
                        </span>
                        <span className="text-[9px] text-textSecondary block mt-1">PNG, JPG ou WEBP</span>
                      </>
                    )}
                  </div>
                  {arquivoUpload && (
                    <div className="mt-2 text-[10px] font-mono text-chiralBlue truncate">
                      Selecionado: {arquivoUpload.name}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!arquivoUpload}
                  className="w-full bg-chiralBlue/10 hover:bg-chiralBlue/20 text-chiralBlue border border-chiralBlue/30 text-xs font-mono font-bold py-3 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-chiralBlue/10"
                >
                  REGISTRAR NO DATASET
                </button>
              </form>
            </div>

            {/* Status do Upload */}
            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-lg text-xs flex gap-2 border ${
                uploadStatus.tipo === 'sucesso' 
                  ? 'bg-greenMain/10 border-greenMain/20 text-greenMain'
                  : uploadStatus.tipo === 'erro'
                  ? 'bg-redMain/10 border-redMain/20 text-redMain'
                  : 'bg-borderColor/30 border-borderColor text-textSecondary'
              }`}>
                {uploadStatus.tipo === 'sucesso' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{uploadStatus.msg}</span>
              </div>
            )}
          </div>

          {/* Lista e Proporções de Classes */}
          <div className="bg-bgCard border border-borderColor p-6 rounded-xl lg:col-span-2 space-y-6 shadow-lg">
            <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
              Distribuição de Classes no Grupo: <span className="text-chiralBlue">{abasGrupos.find(a => a.id === grupoSelecionado)?.nome}</span>
            </h3>

            <div className="space-y-6">
              {classesAtivas.map((classe) => (
                <div key={classe.class_id} className="bg-bgMain/30 border border-borderColor p-4 rounded-lg space-y-3">
                  {/* Cabeçalho da Classe */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-textMain">{classe.name}</span>
                      {renderStatusBadge(classe.balance_status)}
                    </div>
                    <div className="text-xs text-textSecondary font-mono">
                      <strong className="text-textMain font-bold">{classe.count}</strong> imagens ({classe.percentage}%)
                    </div>
                  </div>

                  {/* Barra de Progresso/Proporção */}
                  <div className="w-full bg-borderColor/40 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-chiralBlue h-full transition-all duration-500" 
                      style={{ width: `${classe.percentage}%` }}
                    />
                  </div>

                  {/* Grid de Miniaturas */}
                  <div>
                    <span className="text-[9px] text-textSecondary font-mono uppercase">Amostras carregadas:</span>
                    <div className="grid grid-cols-6 gap-3 mt-1.5">
                      {classe.thumbnails && classe.thumbnails.map((thumbName, index) => (
                        <div key={index} className="aspect-video bg-bgMain border border-borderColor/50 rounded overflow-hidden flex items-center justify-center relative">
                          <img 
                            src={`${urlBackend}/dataset/${grupoSelecionado}/${classe.class_id}/${thumbName}`} 
                            alt="Amostra" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                      {/* Placeholder se não houver miniaturas */}
                      {(!classe.thumbnails || classe.thumbnails.length === 0) && (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="aspect-video bg-borderColor/30 border border-borderColor/30 rounded border-dashed flex items-center justify-center text-[9px] text-textSecondary/50 font-mono">
                            N/A
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
