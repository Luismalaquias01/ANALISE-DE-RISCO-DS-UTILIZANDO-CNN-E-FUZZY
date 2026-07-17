import { useState, useEffect } from 'react';
import Header from './components/UI/Header';
import Dashboard from './components/Dashboard';
import Dataset from './components/Dataset';
import Training from './components/Training';
import WeatherAnalysis from './components/WeatherAnalysis';
import TerrainAnalysis from './components/TerrainAnalysis';
import EpDetection from './components/EpDetection';
import FuzzySystem from './components/FuzzySystem';
import RealTimeInference from './components/RealTimeInference';
import Reports from './components/Reports';
import Settings from './components/Settings';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [urlBackend, setUrlBackend] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline');
  const [modeloTreinado, setModeloTreinado] = useState(false);
  const [cpuUso, setCpuUso] = useState(12);
  const [gpuNome, setGpuNome] = useState("Apple Metal / CPU");

  const [statusSistema, setStatusSistema] = useState<any>(null);
  const [datasetStats, setDatasetStats] = useState<any>(null);

  // Função para buscar dados da API Backend
  const carregarDadosAPI = async () => {
    try {
      // 1. Verificar Status de Saúde
      const resSaude = await fetch(`${urlBackend}/api/system/health`);
      if (resSaude.ok) {
        setApiStatus('online');
        const saude = await resSaude.json();
        setCpuUso(saude.cpu_uso_porcentagem || 0);
        setGpuNome(saude.gpu?.nome || "Apple Metal / CPU");
      } else {
        setApiStatus('offline');
      }

      // 2. Verificar Status do Modelo
      const resModelo = await fetch(`${urlBackend}/api/model/status`);
      if (resModelo.ok) {
        const mod = await resModelo.json();
        setModeloTreinado(mod.modelo_treinado);
        setStatusSistema(mod);
      }

      // 3. Buscar Estatísticas do Dataset
      const resDataset = await fetch(`${urlBackend}/api/dataset/stats`);
      if (resDataset.ok) {
        const ds = await resDataset.json();
        setDatasetStats(ds);
      }

    } catch (e) {
      setApiStatus('offline');
      console.warn("Backend Python offline. Executando em modo de demonstração isolada.");
    }
  };

  // Carregar dados iniciais e programar intervalo de 5s
  useEffect(() => {
    carregarDadosAPI();
    const interval = setInterval(carregarDadosAPI, 5000);
    return () => clearInterval(interval);
  }, [urlBackend]);

  // Renderizar a página de acordo com a aba selecionada
  const renderAbaAtiva = () => {
    switch (abaAtiva) {
      case 'dashboard':
        return <Dashboard statusSistema={statusSistema} datasetStats={datasetStats} />;
      case 'dataset':
        return (
          <Dataset 
            datasetStats={datasetStats} 
            recarregarStats={carregarDadosAPI} 
            urlBackend={urlBackend} 
          />
        );
      case 'treinamento':
        return (
          <Training 
            statusSistema={statusSistema} 
            recarregarStats={carregarDadosAPI} 
            urlBackend={urlBackend} 
          />
        );
      case 'clima':
        return <WeatherAnalysis urlBackend={urlBackend} />;
      case 'terreno':
        return <TerrainAnalysis urlBackend={urlBackend} />;
      case 'ep':
        return <EpDetection urlBackend={urlBackend} />;
      case 'fuzzy':
        return <FuzzySystem />;
      case 'tempo_real':
        return <RealTimeInference urlBackend={urlBackend} />;
      case 'relatorios':
        return <Reports statusSistema={statusSistema} datasetStats={datasetStats} urlBackend={urlBackend} />;
      case 'configuracoes':
        return <Settings urlBackend={urlBackend} setUrlBackend={setUrlBackend} />;
      default:
        return <Dashboard statusSistema={statusSistema} datasetStats={datasetStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-bgMain text-textMain flex flex-col font-sans">
      {/* Cabeçalho Superior com Abas de Navegação Integradas */}
      <Header 
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        apiStatus={apiStatus} 
        modeloTreinado={modeloTreinado} 
        cpuUso={cpuUso} 
        gpuNome={gpuNome} 
      />

      {/* Área de Conteúdo Centralizada */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 overflow-y-auto relative scanline-effect">
        {renderAbaAtiva()}
      </main>
    </div>
  );
}
