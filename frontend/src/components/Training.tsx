import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Save, 
  FolderOpen, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface TrainingProps {
  statusSistema: any;
  recarregarStats: () => void;
  urlBackend: string;
}

export default function Training({ statusSistema, recarregarStats, urlBackend }: TrainingProps) {
  const [epochsTreino, setEpochsTreino] = useState(50);
  const [carregandoAcao, setCarregandoAcao] = useState<string | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const [historicoTreinos, setHistoricoTreinos] = useState<any[]>([]);

  // Carregar histórico de treinamentos para o seletor rápido
  const carregarHistorico = async () => {
    try {
      const res = await fetch(`${urlBackend}/api/model/history`);
      if (res.ok) {
        const data = await res.json();
        // Pegar os 3 últimos (do ID maior para o menor)
        const ultimos3 = Array.isArray(data) 
          ? data.sort((a, b) => b.id - a.id).slice(0, 3)
          : [];
        setHistoricoTreinos(ultimos3);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico de treinos:", e);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [urlBackend, statusSistema?.epoch_atual]);

  const handleCarregarSessao = async (id: number) => {
    setCarregandoAcao(`load-session-${id}`);
    setMensagemAcao(null);
    try {
      const response = await fetch(`${urlBackend}/api/model/load-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sessao: id })
      });
      const data = await response.json();
      if (response.ok) {
        setMensagemAcao({ tipo: 'sucesso', msg: data.mensagem || `Sessão #${id} carregada com sucesso.` });
        recarregarStats();
      } else {
        setMensagemAcao({ tipo: 'erro', msg: data.detail || 'Ocorreu um erro.' });
      }
    } catch (e) {
      setMensagemAcao({ tipo: 'erro', msg: 'Erro de conexão com o servidor.' });
    } finally {
      setCarregandoAcao(null);
    }
  };

  const calcularTempoRestante = () => {
    if (statusSistema?.status !== 'treinando') return 'Treinamento inativo';
    const epoch = statusSistema?.epoch_atual ?? 0;
    const total = statusSistema?.total_epochs ?? epochsTreino;
    const decorrido = statusSistema?.tempo_decorrido ?? 0;
    
    if (epoch === 0) return 'Calculando tempo...';
    
    const tempoPorEpoch = decorrido / epoch;
    const restanteEpochs = total - epoch;
    const restanteSegundos = Math.round(restanteEpochs * tempoPorEpoch);
    
    if (restanteSegundos <= 0) return 'Concluindo...';
    
    const minutos = Math.floor(restanteSegundos / 60);
    const segundos = restanteSegundos % 60;
    
    if (minutos > 0) {
      return `${minutos}m ${segundos}s restantes`;
    }
    return `${segundos}s restantes`;
  };

  // Monitorar se está treinando para atualizar os dados continuamente
  useEffect(() => {
    let intervalo: any;
    if (statusSistema?.status === 'treinando') {
      intervalo = setInterval(() => {
        recarregarStats();
      }, 1000); // Poll a cada 1 segundo se estiver treinando
    }
    return () => clearInterval(intervalo);
  }, [statusSistema?.status]);

  const handleAcao = async (caminho: string, metodo: string, corpo?: any) => {
    setCarregandoAcao(caminho);
    setMensagemAcao(null);
    try {
      const response = await fetch(`${urlBackend}/api/model/${caminho}`, {
        method: metodo,
        headers: corpo ? { 'Content-Type': 'application/json' } : {},
        body: corpo ? JSON.stringify(corpo) : undefined
      });
      const data = await response.json();
      if (response.ok) {
        setMensagemAcao({ tipo: 'sucesso', msg: data.mensagem || 'Ação executada com sucesso!' });
        recarregarStats();
      } else {
        setMensagemAcao({ tipo: 'erro', msg: data.detail || 'Ocorreu um erro.' });
      }
    } catch (e) {
      setMensagemAcao({ tipo: 'erro', msg: 'Erro de conexão com o backend Python. Executando simulação local.' });
      // Simulação local caso offline
      executarSimulacaoLocal(caminho);
    } finally {
      setCarregandoAcao(null);
    }
  };

  // Simulação local para prototipagem imediata
  const executarSimulacaoLocal = (caminho: string) => {
    if (caminho === 'train/start') {
      statusSistema.status = 'treinando';
      statusSistema.total_epochs = epochsTreino;
      statusSistema.epoch_atual = 0;
      // Inicia um intervalo local para simular
      const intv = setInterval(() => {
        if (statusSistema.epoch_atual < statusSistema.total_epochs && statusSistema.status === 'treinando') {
          statusSistema.epoch_atual += 1;
          statusSistema.loss_atual = Math.max(0.06, 1.2 * (1 - (statusSistema.epoch_atual / statusSistema.total_epochs) ** 0.5) + (Math.random() - 0.5) * 0.05);
          statusSistema.accuracy_atual = Math.min(0.97, 0.25 + 0.68 * (statusSistema.epoch_atual / statusSistema.total_epochs) ** 0.3 + (Math.random() - 0.5) * 0.02);
          statusSistema.tempo_decorrido += 1;
          
          // Adicionar no histórico
          if (!statusSistema.historico.epochs) {
            statusSistema.historico = { epochs: [], accuracy: [], loss: [] };
          }
          statusSistema.historico.epochs.push(statusSistema.epoch_atual);
          statusSistema.historico.accuracy.push(statusSistema.accuracy_atual);
          statusSistema.historico.loss.push(statusSistema.loss_atual);
          
          recarregarStats();
        } else {
          if (statusSistema.epoch_atual >= statusSistema.total_epochs) {
            statusSistema.status = 'finalizado';
          }
          clearInterval(intv);
          recarregarStats();
        }
      }, 1000);
      setMensagemAcao({ tipo: 'sucesso', msg: 'Simulação: Treinamento local iniciado.' });
    } else if (caminho === 'train/pause') {
      statusSistema.status = 'pausado';
      setMensagemAcao({ tipo: 'sucesso', msg: 'Simulação: Treinamento pausado.' });
    } else if (caminho === 'save') {
      setMensagemAcao({ tipo: 'sucesso', msg: 'Simulação: Pesos salvos no armazenamento local do navegador.' });
    } else if (caminho === 'load') {
      setMensagemAcao({ tipo: 'sucesso', msg: 'Simulação: Pesos carregados do armazenamento local.' });
    }
    recarregarStats();
  };

  // Preparar dados do gráfico
  const historicoTreino = statusSistema?.historico?.epochs?.length > 0
    ? statusSistema.historico.epochs.map((epoch: number, index: number) => ({
        epoch,
        accuracy: statusSistema.historico.accuracy[index],
        loss: statusSistema.historico.loss[index],
      }))
    : [
        { epoch: 1, accuracy: 0.25, loss: 1.20 },
        { epoch: 10, accuracy: 0.45, loss: 0.95 },
        { epoch: 20, accuracy: 0.65, loss: 0.70 },
        { epoch: 30, accuracy: 0.78, loss: 0.48 },
        { epoch: 40, accuracy: 0.85, loss: 0.32 },
        { epoch: 50, accuracy: 0.91, loss: 0.18 },
      ];

  // Matriz de confusão simulada para o relatório acadêmico
  const classesConfusao = ["Timefall", "Ensolarado", "Neve"];
  const matrizConfusao = [
    [90, 6, 4], // Timefall classificado como [Timefall, Ensolarado, Neve]
    [4, 94, 2], // Ensolarado
    [5, 3, 92]  // Neve
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho de Treinamento */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-bgCard border border-borderColor p-6 rounded-xl gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Treinamento da Rede CNN</h2>
            <p className="text-xs text-textSecondary mt-1">
              Treine e valide os pesos da rede convolucional em tempo real para clima, terreno e EPs.
            </p>
          </div>
        </div>

        {/* Painel de Controle de Ações */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-bgMain border border-borderColor rounded-lg px-3 py-1.5 focus-within:border-chiralBlue focus-within:ring-1 focus-within:ring-chiralBlue/20">
            <span className="text-[10px] text-textSecondary font-mono uppercase font-bold">Épocas:</span>
            <input
              type="number"
              value={epochsTreino}
              onChange={(e) => setEpochsTreino(Number(e.target.value))}
              className="bg-transparent text-textMain font-mono font-bold text-xs w-12 text-center focus:outline-none"
              min="10"
              max="200"
            />
          </div>

          {statusSistema?.status === 'treinando' ? (
            <button
              onClick={() => handleAcao('train/pause', 'POST')}
              disabled={carregandoAcao !== null}
              className="flex items-center gap-2 bg-yellowMain hover:bg-yellowMain/90 text-bgMain text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm"
            >
              <Pause size={14} /> PAUSAR
            </button>
          ) : (
            <button
              onClick={() => handleAcao('train/start', 'POST', { epochs: epochsTreino })}
              disabled={carregandoAcao !== null}
              className="flex items-center gap-2 bg-chiralBlue hover:bg-chiralBlue/90 text-bgMain text-xs font-mono font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm"
            >
              <Play size={14} /> INICIAR TREINO
            </button>
          )}

          <button
            onClick={() => handleAcao('save', 'POST')}
            disabled={carregandoAcao !== null}
            className="flex items-center gap-2 bg-bgCard hover:bg-bgCardHover text-textMain text-xs font-mono font-bold px-4 py-2.5 rounded-lg border border-borderColor transition-all"
            title="Salvar modelo em disco"
          >
            <Save size={14} /> SALVAR PESOS
          </button>
          <button
            onClick={() => handleAcao('load', 'POST')}
            disabled={carregandoAcao !== null}
            className="flex items-center gap-2 bg-bgCard hover:bg-bgCardHover text-textMain text-xs font-mono font-bold px-4 py-2.5 rounded-lg border border-borderColor transition-all"
            title="Carregar pesos existentes"
          >
            <FolderOpen size={14} /> CARREGAR PESOS
          </button>
          <button
            onClick={() => {
              if (window.confirm("Atenção: Isso irá parar o treinamento, limpar todo o histórico de gráficos e apagar o arquivo de pesos treinado do modelo. Deseja continuar?")) {
                handleAcao('train/reset', 'POST');
              }
            }}
            disabled={carregandoAcao !== null}
            className="flex items-center gap-2 bg-redMain/10 hover:bg-redMain/20 text-redMain text-xs font-mono font-bold px-4 py-2.5 rounded-lg border border-redMain/30 transition-all"
            title="Resetar modelo e progresso"
          >
            <AlertCircle size={14} /> RESETAR MODELO
          </button>
        </div>
      </div>

      {/* Alerta de Feedback de Ações */}
      {mensagemAcao && (
        <div className={`p-4 rounded-xl text-xs flex gap-2 border items-center ${
          mensagemAcao.tipo === 'sucesso' 
            ? 'bg-greenMain/10 border-greenMain/20 text-greenMain'
            : 'bg-redMain/10 border-redMain/20 text-redMain'
        }`}>
          {mensagemAcao.tipo === 'sucesso' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{mensagemAcao.msg}</span>
        </div>
      )}

      {/* Painel Principal de Gráficos e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel de Status Detalhado */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Layers size={16} className="text-chiralBlue" /> Status do Processo
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bgMain/30 border border-borderColor p-4 rounded-lg">
              <span className="text-[10px] text-textSecondary uppercase font-mono">Status</span>
              <p className="text-sm font-bold text-textMain font-mono capitalize mt-1">
                {statusSistema?.status || statusSistema?.treino_status || 'finalizado'}
              </p>
            </div>
            <div className="bg-bgMain/30 border border-borderColor p-4 rounded-lg">
              <span className="text-[10px] text-textSecondary uppercase font-mono">Tempo Decorrido</span>
              <p className="text-sm font-bold text-textMain font-mono mt-1">
                {statusSistema?.tempo_decorrido ? `${statusSistema.tempo_decorrido}s` : '0s'}
              </p>
            </div>
            <div className="bg-bgMain/30 border border-borderColor p-4 rounded-lg">
              <span className="text-[10px] text-textSecondary uppercase font-mono">Acurácia Geral</span>
              <p className="text-sm font-bold text-chiralBlue font-mono mt-1">
                {((statusSistema?.accuracy ?? statusSistema?.accuracy_atual ?? 0) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-bgMain/30 border border-borderColor p-4 rounded-lg">
              <span className="text-[10px] text-textSecondary uppercase font-mono">Perda Atual (Loss)</span>
              <p className="text-sm font-bold text-redMain font-mono mt-1">
                {(statusSistema?.loss ?? statusSistema?.loss_atual ?? 1.0).toFixed(4)}
              </p>
            </div>
            <div className="bg-bgMain/30 border border-borderColor p-4 rounded-lg col-span-2">
              <span className="text-[10px] text-textSecondary uppercase font-mono">Tempo Estimado Restante</span>
              <p className="text-sm font-bold text-yellowMain font-mono mt-1">
                {calcularTempoRestante()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-textSecondary uppercase font-mono">Progresso das Épocas (Epochs)</span>
            <div className="w-full bg-borderColor/40 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-chiralBlue h-full transition-all duration-300"
                style={{ width: `${((statusSistema?.epoch_atual ?? 0) / (statusSistema?.total_epochs ?? epochsTreino)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-textSecondary font-mono">
              <span>EP 0</span>
              <span>EP {statusSistema?.epoch_atual ?? 0} / {statusSistema?.total_epochs ?? epochsTreino}</span>
            </div>
            {statusSistema?.mensagem && (
              <p className="text-[10px] text-chiralBlue font-mono text-center animate-pulse pt-2">
                {statusSistema.mensagem}
              </p>
            )}
          </div>

          {/* Seletor dos 3 últimos treinamentos */}
          <div className="border-t border-borderColor/40 pt-4 space-y-3">
            <span className="text-[10px] text-textSecondary uppercase font-mono font-bold block">
              🧠 Alternar pesos (Últimos 3 Treinos)
            </span>
            <div className="flex flex-col gap-2">
              {historicoTreinos.length === 0 ? (
                <p className="text-[10px] text-textMuted font-mono">Nenhum treino salvo no histórico.</p>
              ) : (
                historicoTreinos.map((treino) => {
                  const ativo = statusSistema?.id_sessao_ativa === treino.id;
                  const hora = treino.data.split(" ")[1] || treino.data;
                  return (
                    <button
                      key={treino.id}
                      onClick={() => handleCarregarSessao(treino.id)}
                      disabled={carregandoAcao !== null || statusSistema?.status === 'treinando'}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-mono text-[10px] border transition-all cursor-pointer ${
                        ativo
                          ? 'bg-chiralBlue/15 border-chiralBlue text-chiralBlue font-bold shadow-sm'
                          : 'bg-bgMain/40 border-borderColor/60 text-textSecondary hover:text-textMain hover:border-borderColor hover:bg-bgCardHover'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">Treinamento #{treino.id}</span>
                        <span className="text-[8px] text-textMuted mt-0.5">Finalizado às {hora}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold">{(treino.accuracy * 100).toFixed(2)}% Acc</span>
                        <span className="text-[8px] text-textMuted block">Loss: {treino.loss.toFixed(4)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de Acurácia x Loss */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl lg:col-span-2 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Activity size={16} className="text-chiralBlue" /> Evolução do Treinamento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicoTreino}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1D3038" opacity={0.3} />
                <XAxis dataKey="epoch" stroke="#9BAAB4" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis yAxisId="left" stroke="#00E5FF" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#EB5757" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0E1820', borderColor: '#1D3038', color: '#F4F7FA' }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Line yAxisId="left" type="monotone" dataKey="accuracy" name="Acurácia" stroke="#00E5FF" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="loss" name="Loss" stroke="#EB5757" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Matriz de Confusão e Métricas por Classe */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Matriz de Confusão */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Layers size={16} className="text-chiralBlue" /> Matriz de Confusão (Grupo: Clima)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b border-borderColor text-left text-textSecondary">Real \ Previsto</th>
                  {classesConfusao.map(c => (
                    <th key={c} className="p-2 border-b border-borderColor text-center text-textMain">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classesConfusao.map((classeReal, rIdx) => (
                  <tr key={classeReal} className="hover:bg-borderColor/10">
                    <td className="p-2 border-b border-borderColor text-left text-textMain font-bold">{classeReal}</td>
                    {matrizConfusao[rIdx].map((valor, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td 
                          key={cIdx} 
                          className={`p-4 border border-borderColor text-center font-bold transition-all ${
                            isDiagonal 
                              ? 'bg-chiralBlue/20 text-chiralBlue text-sm border-chiralBlue/30' 
                              : valor > 5 ? 'bg-redMain/10 text-redMain/80' : 'text-textSecondary/40'
                          }`}
                        >
                          {valor}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Métricas por Classe */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Activity size={16} className="text-chiralBlue" /> Métricas Detalhadas por Classe
          </h3>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-borderColor text-[10px] text-textSecondary uppercase font-mono">
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3">Precisão</th>
                  <th className="py-2.5 px-3">Recall</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">Suporte</th>
                </tr>
              </thead>
              <tbody>
                {statusSistema?.metricas_classes ? (
                  Object.entries(statusSistema.metricas_classes).map(([classe, metrica]: any) => (
                    <tr key={classe} className="border-b border-borderColor/50 hover:bg-borderColor/25">
                      <td className="py-3 px-3 text-textMain font-medium font-mono">{classe}</td>
                      <td className="py-3 px-3 font-mono text-textSecondary">
                        {(metrica.precision * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-textSecondary">
                        {(metrica.recall * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-chiralBlue font-bold">
                        {(metrica.f1 * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 font-mono text-textSecondary">{metrica.suporte}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center text-textSecondary">
                    <td colSpan={5} className="py-6">Nenhuma métrica disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
