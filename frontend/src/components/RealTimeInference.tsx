import { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Play, 
  Square, 
  Activity, 
  CloudSun, 
  Mountain, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface RealTimeInferenceProps {
  urlBackend: string;
}

interface EventoLinhaTempo {
  horario: string;
  mensagem: string;
  tipo: 'clima' | 'terreno' | 'ep' | 'fuzzy' | 'sistema';
}

const OdradekVisualizer = ({ epState }: { epState: string }) => {
  let animationClass = "odradek-spin-slow";
  let color = "#00E5FF"; // chiral cyan

  if (epState === "Área de EP") {
    animationClass = "odradek-spin-medium";
    color = "#FACC15"; // warning yellow
  } else if (epState === "EP próxima") {
    animationClass = "odradek-spin-fast";
    color = "#FF7A00"; // orange
  } else if (epState === "Combate EP" || epState === "Boss EP") {
    animationClass = "odradek-spin-boss";
    color = "#EF4444"; // red
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-bgCard/60 border border-borderColor rounded-lg relative overflow-hidden h-full corner-deco">
      <div className="absolute top-2 left-2 text-[7px] font-mono text-textSecondary uppercase tracking-widest pointer-events-none select-none">
        ODRADEK TELEMETRY
      </div>
      
      {/* SVG Odradek Star */}
      <div className="w-24 h-24 relative flex items-center justify-center my-2 select-none pointer-events-none">
        {/* Outer scanner boundary ring */}
        <div className="absolute w-20 h-20 rounded-full border border-dashed border-textSecondary/5 animate-pulse" />
        
        <svg 
          viewBox="0 0 100 100" 
          className={`w-full h-full transition-all duration-500 ${animationClass}`}
          style={{ color }}
        >
          {/* Central core */}
          <circle cx="50" cy="50" r="7" fill="currentColor" className="opacity-90" />
          <circle cx="50" cy="50" r="11" stroke="currentColor" strokeWidth="1" fill="none" className="opacity-50 animate-ping" />
          
          {/* Odradek 5 arms / fan blades */}
          {[0, 72, 144, 216, 288].map((angle, index) => {
            const rad = (angle * Math.PI) / 180;
            // Draw an arm extending out
            const x2 = 50 + 33 * Math.sin(rad);
            const y2 = 50 - 33 * Math.cos(rad);
            
            // Draw a leaf/blade at the tip
            const xTip = 50 + 38 * Math.sin(rad);
            const yTip = 50 - 38 * Math.cos(rad);
            
            // Blade coordinates
            const radLeft = ((angle - 14) * Math.PI) / 180;
            const radRight = ((angle + 14) * Math.PI) / 180;
            
            const xLeft = 50 + 30 * Math.sin(radLeft);
            const yLeft = 50 - 30 * Math.cos(radLeft);
            
            const xRight = 50 + 30 * Math.sin(radRight);
            const yRight = 50 - 30 * Math.cos(radRight);

            return (
              <g key={index}>
                {/* Arm stem */}
                <line x1="50" y1="50" x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" className="opacity-90" />
                {/* Blade geometry */}
                <polygon 
                  points={`${x2},${y2} ${xLeft},${yLeft} ${xTip},${yTip} ${xRight},${yRight}`} 
                  fill="currentColor" 
                  className="opacity-75"
                />
                {/* Micro target dots */}
                <circle cx={xTip} cy={yTip} r="1.5" fill="#FFFFFF" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-1 text-center w-full">
        <span className="text-[7px] font-mono text-textSecondary uppercase block tracking-wider">SCANNER STATE</span>
        <span 
          className="text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-300 block truncate"
          style={{ color }}
        >
          {epState || "NORMAL"}
        </span>
      </div>
    </div>
  );
};

export default function RealTimeInference({ urlBackend }: RealTimeInferenceProps) {
  // Estados de Controle de Captura
  const [capturaAtiva, setCapturaAtiva] = useState(false);
  const [fpsAnalise, setFpsAnalise] = useState(0);
  const [resolucao, setResolucao] = useState("0 x 0");
  const [framesAnalisados, setFramesAnalisados] = useState(0);
  const [tempoAnalise, setTempoAnalise] = useState(0);
  const [modoDemonstracao, setModoDemonstracao] = useState(false);

  // Estados de Resultados
  const [dadosInferencia, setDadosInferencia] = useState<any>(null);
  const [linhaTempo, setLinhaTempo] = useState<EventoLinhaTempo[]>([]);
  const [historicoGrafico, setHistoricoGrafico] = useState<any[]>([]);

  // Refs de mídia e loops
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const framesAnteriores = useRef(0);
  const fpsIntervaloRef = useRef<any>(null);

  // 1. Efeito para incrementar o cronômetro de tempo de análise
  useEffect(() => {
    let cronometro: any;
    if (capturaAtiva) {
      cronometro = setInterval(() => {
        setTempoAnalise(prev => prev + 1);
      }, 1000);
    } else {
      setTempoAnalise(0);
    }
    return () => clearInterval(cronometro);
  }, [capturaAtiva]);

  // 2. Efeito para cálculo de FPS de processamento real
  useEffect(() => {
    if (capturaAtiva) {
      fpsIntervaloRef.current = setInterval(() => {
        const diff = framesAnalisados - framesAnteriores.current;
        setFpsAnalise(diff);
        framesAnteriores.current = framesAnalisados;
      }, 1000);
    } else {
      setFpsAnalise(0);
      framesAnteriores.current = 0;
      clearInterval(fpsIntervaloRef.current);
    }
    return () => clearInterval(fpsIntervaloRef.current);
  }, [capturaAtiva, framesAnalisados]);

  // 3. Iniciar Captura de Tela
  const iniciarCaptura = async () => {
    try {
      // Solicita captura de tela ao navegador
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Obter resolução do stream
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setResolucao(`${settings.width || 1280} x ${settings.height || 720}`);

      // Registrar parada automática caso o usuário pare de compartilhar na barra do navegador
      track.onended = () => {
        pararCaptura();
      };

      setCapturaAtiva(true);
      setFramesAnalisados(0);
      setLinhaTempo([{ horario: "00:00", mensagem: "Captura de tela iniciada pelo usuário.", tipo: "sistema" }]);
      setHistoricoGrafico([]);
      setDadosInferencia(null);

      // Tentar conectar via WebSocket no backend Python
      conectarWebSocketETeclearLoop();

    } catch (err) {
      console.error("Erro ao solicitar captura de tela:", err);
      alert("Não foi possível iniciar a captura de tela. Verifique as permissões de compartilhamento.");
    }
  };

  // 4. Parar Captura de Tela
  const pararCaptura = () => {
    setCapturaAtiva(false);
    
    // Parar todos os tracks de vídeo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Parar loops de envio de frames
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }

    // Fechar socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  // 5. Conectar WebSocket e agendar capturas a cada 1s
  const conectarWebSocketETeclearLoop = () => {
    // Determinar se vamos usar WebSocket ou rodar em modo simulação pura
    const wsUrl = urlBackend.replace(/^http/, 'ws') + '/api/inference/live';

    try {
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log("WebSocket de inferência ao vivo conectado.");
        setModoDemonstracao(false);
        iniciarLoopCaptura(false);
      };

      socketRef.current.onmessage = (event) => {
        const dados = JSON.parse(event.data);
        atualizarEstadosInferencia(dados);
      };

      socketRef.current.onerror = () => {
        console.warn("Erro ao conectar WebSocket. Ativando modo de simulação académica.");
        setModoDemonstracao(true);
        socketRef.current = null;
        iniciarLoopCaptura(true);
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket de inferência encerrado.");
      };

    } catch (e) {
      setModoDemonstracao(true);
      iniciarLoopCaptura(true);
    }
  };

  // 6. Loop de captura e envio a cada 1 segundo
  const iniciarLoopCaptura = (modoSimulado: boolean) => {
    if (loopRef.current) clearInterval(loopRef.current);

    loopRef.current = setInterval(() => {
      if (!streamRef.current || !streamRef.current.active) {
        pararCaptura();
        return;
      }

      setFramesAnalisados(prev => prev + 1);

      if (modoSimulado) {
        // Roda a simulação local para atualizar a UI de forma realista
        executarAnaliseSimulada();
      } else {
        // Envia o frame atual via WebSocket
        enviarFrameViaSocket();
      }
    }, 1000); // 1 segundo
  };

  // Copia o frame do video para o canvas, converte para base64 e envia
  const enviarFrameViaSocket = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Redimensionar para processamento na rede CNN (128x128 pixels é o ideal para a rede)
      canvas.width = 128;
      canvas.height = 128;
      ctx.drawImage(video, 0, 0, 128, 128);

      // Obter string Base64 da imagem
      const base64Img = canvas.toDataURL('image/jpeg', 0.8);
      // Enviar no WebSocket
      socketRef.current.send(base64Img);
    }
  };

  // 7. Simulação acadêmica para demonstrar o frontend sem backend rodando
  // Simula Sam Bridges andando pela floresta, aproximando-se de EPs com chuva de Timefall,
  // entrando em combate, e depois escapando para segurança.
  const executarAnaliseSimulada = () => {
    const fCount = framesAnalisados + 1;
    const minutos = Math.floor(tempoAnalise / 60);
    const segundos = tempoAnalise % 60;
    const timestampStr = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

    // Construir a evolução do cenário
    // Fase 1: Exploração normal com sol (fCount < 10)
    // Fase 2: Entrada na floresta sob chuva leve (10 <= fCount < 20)
    // Fase 3: Chuva de Timefall e Odradek detecta EPs (20 <= fCount < 35)
    // Fase 4: Combate EP Crítico (35 <= fCount < 50)
    // Fase 5: Boss EP surge sob neve pesada (50 <= fCount < 65)
    // Fase 6: Fuga e retorno ao Sol em área urbana (fCount >= 65)

    let climaDom = "Ensolarado";
    let terrenoDom = "Campo / Vegetação";
    let epDom = "Exploração normal";

    let cProbs = { "Ensolarado": 92, "Chuva / Timefall": 4, "Neve": 4 };
    let tProbs = { "Campo / Vegetação": 85, "Rochoso": 5, "Montanhoso": 4, "Nevado": 2, "Rio / Lago": 2, "Área urbana / instalações": 2 };
    let eProbs = { "Exploração normal": 92, "Área de EP": 4, "EP próxima": 2, "Combate EP": 1, "Boss EP": 1 };

    if (fCount >= 10 && fCount < 20) {
      climaDom = "Chuva / Timefall";
      terrenoDom = "Rochoso";
      cProbs = { "Ensolarado": 20, "Chuva / Timefall": 75, "Neve": 5 };
      tProbs = { "Campo / Vegetação": 30, "Rochoso": 50, "Montanhoso": 15, "Nevado": 1, "Rio / Lago": 2, "Área urbana / instalações": 2 };
    } else if (fCount >= 20 && fCount < 35) {
      climaDom = "Chuva / Timefall";
      terrenoDom = "Montanhoso";
      epDom = "EP próxima";
      cProbs = { "Ensolarado": 5, "Chuva / Timefall": 90, "Neve": 5 };
      tProbs = { "Campo / Vegetação": 10, "Rochoso": 20, "Montanhoso": 65, "Nevado": 1, "Rio / Lago": 2, "Área urbana / instalações": 2 };
      eProbs = { "Exploração normal": 10, "Área de EP": 15, "EP próxima": 70, "Combate EP": 4, "Boss EP": 1 };
    } else if (fCount >= 35 && fCount < 50) {
      climaDom = "Chuva / Timefall";
      terrenoDom = "Montanhoso";
      epDom = "Combate EP";
      cProbs = { "Ensolarado": 2, "Chuva / Timefall": 96, "Neve": 2 };
      tProbs = { "Campo / Vegetação": 5, "Rochoso": 20, "Montanhoso": 70, "Nevado": 1, "Rio / Lago": 2, "Área urbana / instalações": 2 };
      eProbs = { "Exploração normal": 2, "Área de EP": 8, "EP próxima": 10, "Combate EP": 78, "Boss EP": 2 };
    } else if (fCount >= 50 && fCount < 65) {
      climaDom = "Neve";
      terrenoDom = "Nevado";
      epDom = "Boss EP";
      cProbs = { "Ensolarado": 2, "Chuva / Timefall": 18, "Neve": 80 };
      tProbs = { "Campo / Vegetação": 5, "Rochoso": 20, "Montanhoso": 60, "Nevado": 13, "Rio / Lago": 1, "Área urbana / instalações": 1 };
      eProbs = { "Exploração normal": 1, "Área de EP": 4, "EP próxima": 5, "Combate EP": 10, "Boss EP": 80 };
    } else if (fCount >= 65) {
      climaDom = "Ensolarado";
      terrenoDom = "Área urbana / instalações";
      epDom = "Exploração normal";
      cProbs = { "Ensolarado": 92, "Chuva / Timefall": 4, "Neve": 4 };
      tProbs = { "Campo / Vegetação": 10, "Rochoso": 8, "Montanhoso": 4, "Nevado": 2, "Rio / Lago": 2, "Área urbana / instalações": 74 };
      eProbs = { "Exploração normal": 95, "Área de EP": 2, "EP próxima": 1, "Combate EP": 1, "Boss EP": 1 };
    }

    // Cálculo simplificado local de Risco, Travessia e Perigo
    let riscoAtaque = 15;
    if (epDom === "EP próxima") riscoAtaque = 65;
    else if (epDom === "Combate EP") riscoAtaque = 88;
    else if (epDom === "Boss EP") riscoAtaque = 95;
    else if (epDom === "Área de EP") riscoAtaque = 35;

    let travessiaDiff = 20;
    if (terrenoDom === "Montanhoso") travessiaDiff = 72;
    else if (terrenoDom === "Rochoso") travessiaDiff = 48;
    else if (terrenoDom === "Rio / Lago") travessiaDiff = 60;
    else if (terrenoDom === "Nevado") travessiaDiff = 85;

    let perigoVal = 15;
    if (climaDom === "Chuva / Timefall" || climaDom === "Neve") perigoVal = Math.round((riscoAtaque + travessiaDiff) / 2);
    if (epDom === "Boss EP" || epDom === "Combate EP") perigoVal = Math.max(perigoVal, 85);

    let fuzzyLabel = "Baixo";
    if (perigoVal > 75) fuzzyLabel = "Crítico";
    else if (perigoVal > 50) fuzzyLabel = "Alto";
    else if (perigoVal > 25) fuzzyLabel = "Médio";

    // Mapeamento dos diagnósticos inteligentes
    let diagnostico = "Condições estáveis de exploração. Clima limpo e sem leituras de perigo no Odradek.";
    if (epDom === "Boss EP") {
      diagnostico = "PRESENÇA DE BOSS EP DETECTADA. Evacue a área imediatamente ou prepare-se para combate de alta escala!";
    } else if (epDom === "Combate EP") {
      diagnostico = "Combate ativo com entidade EP. Cuidado com o nível de sangue (HP) e use armas de hemográvida.";
    } else if (epDom === "EP próxima") {
      diagnostico = "Odradek apontando atividade de EP próxima. Fique abaixado e segure a respiração.";
    } else if (climaDom === "Chuva / Timefall") {
      diagnostico = "Chuva/Timefall ativa acelerando a deterioração da carga e atraindo criaturas.";
    }

    const simMockResponse = {
      timestamp: timestampStr,
      frame_number: fCount,
      weather: {
        dominant_class: climaDom,
        confidence: cProbs[climaDom as keyof typeof cProbs],
        probabilities: cProbs
      },
      terrain: {
        dominant_class: terrenoDom,
        confidence: tProbs[terrenoDom as keyof typeof tProbs],
        probabilities: tProbs
      },
      ep_state: {
        dominant_class: epDom,
        confidence: eProbs[epDom as keyof typeof eProbs],
        probabilities: eProbs
      },
      fuzzy: {
        attack_risk: riscoAtaque,
        crossing_difficulty: travessiaDiff,
        danger_level: perigoVal,
        label: fuzzyLabel
      },
      diagnosis: diagnostico
    };

    atualizarEstadosInferencia(simMockResponse);
  };

  // 8. Atualizar Estados e registrar logs de Linha do Tempo de forma controlada
  const atualizarEstadosInferencia = (dados: any) => {
    setDadosInferencia(dados);

    // Adicionar dados no histórico do gráfico
    setHistoricoGrafico(prev => {
      const novos = [...prev, {
        tempo: dados.timestamp,
        perigo: dados.fuzzy.danger_level,
        clima_conf: dados.weather.confidence,
        terreno_conf: dados.terrain.confidence
      }];
      // Manter apenas os últimos 30 segundos
      if (novos.length > 30) novos.shift();
      return novos;
    });

    // Validar se geramos evento na linha do tempo
    setLinhaTempo(prev => {
      const ultimoLog = prev[prev.length - 1];
      const novosLogs = [...prev];

      // Verificar alterações de clima
      if (ultimoLog && !ultimoLog.mensagem.includes(dados.weather.dominant_class) && dados.weather.confidence > 75) {
        if (dados.weather.dominant_class === "Chuva / Timefall") {
          novosLogs.push({
            horario: dados.timestamp,
            mensagem: "Chuva / Timefall detectada pelo scanner.",
            tipo: "clima"
          });
        }
      }

      // Verificar risco de ataque fuzzy
      if (ultimoLog && dados.fuzzy.danger_level > 70 && !ultimoLog.mensagem.includes("subiu para")) {
        novosLogs.push({
          horario: dados.timestamp,
          mensagem: `Nível de perigo subiu para ${dados.fuzzy.label} (${dados.fuzzy.danger_level}%)`,
          tipo: "fuzzy"
        });
      }

      // Verificar alteração de EP
      if (ultimoLog && !ultimoLog.mensagem.includes(dados.ep_state.dominant_class) && dados.ep_state.confidence > 70) {
        novosLogs.push({
          horario: dados.timestamp,
          mensagem: `Estado EP alterado para: ${dados.ep_state.dominant_class}`,
          tipo: "ep"
        });
      }

      // Limitar a linha do tempo nos últimos 15 eventos
      if (novosLogs.length > 15) novosLogs.shift();
      return novosLogs;
    });
  };

  // Componente de Dials circulares do Fuzzy
  const renderDialFuzzy = (valor: number, titulo: string, cor: string, faixa: string) => {
    const raio = 30;
    const circ = 2 * Math.PI * raio;
    const offset = circ - (valor / 100) * circ;

    let corTexto = "text-greenMain";
    let borderHighlight = "border-borderColor hover:border-chiralBlue/30";
    let glowStyle = {};
    
    if (faixa === "Crítico") {
      corTexto = "text-redMain";
      borderHighlight = "border-redMain/30 shadow-md shadow-redMain/5";
      glowStyle = { filter: "drop-shadow(0 0 4px rgba(235, 87, 87, 0.6))" };
    } else if (faixa === "Alto") {
      corTexto = "text-orangeMain";
      borderHighlight = "border-orangeMain/30 shadow-md shadow-orangeMain/5";
      glowStyle = { filter: "drop-shadow(0 0 4px rgba(242, 153, 74, 0.6))" };
    } else if (faixa === "Médio") {
      corTexto = "text-yellowMain";
      borderHighlight = "border-yellowMain/30 shadow-md shadow-yellowMain/5";
      glowStyle = { filter: "drop-shadow(0 0 4px rgba(242, 201, 76, 0.6))" };
    } else {
      borderHighlight = "border-chiralBlue/30 shadow-md shadow-chiralBlue/5";
      glowStyle = { filter: "drop-shadow(0 0 4px rgba(0, 229, 255, 0.5))" };
    }

    return (
      <div className={`flex flex-col items-center p-3 bg-bgCard border rounded-lg corner-deco transition-all duration-300 shadow-md ${borderHighlight}`}>
        <span className="text-[8px] text-textSecondary uppercase font-mono font-bold tracking-wider mb-2">{titulo}</span>
        <div className="relative w-20 h-20 flex items-center justify-center">
          
          {/* Anel de Calibração Externo */}
          <div className="absolute w-18 h-18 rounded-full border border-dashed border-textSecondary/15 animate-spin" style={{ animationDuration: '40s' }} />
          
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fundo */}
            <circle cx="40" cy="40" r={raio} stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="rgba(11,15,20,0.4)" />
            {/* Arco principal do medidor */}
            <circle 
              cx="40" 
              cy="40" 
              r={raio} 
              stroke={cor} 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              style={glowStyle}
            />
            {/* Marcadores de alvo */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <line
                key={ang}
                x1={40 + (raio - 4) * Math.cos((ang * Math.PI) / 180)}
                y1={40 + (raio - 4) * Math.sin((ang * Math.PI) / 180)}
                x2={40 + raio * Math.cos((ang * Math.PI) / 180)}
                y2={40 + raio * Math.sin((ang * Math.PI) / 180)}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            ))}
          </svg>
          
          {/* Valor Numérico */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-sm font-bold font-mono text-textMain tracking-tighter">{valor}%</span>
          </div>
        </div>
        <span className={`text-[8px] font-bold uppercase font-mono mt-2 tracking-widest ${corTexto} text-blink`}>{faixa}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Elementos ocultos para capturar frames */}
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
            <Tv size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Classificação em Tempo Real por Captura de Tela</h2>
            <p className="text-xs text-textSecondary mt-1">
              Selecione a janela ou aba com a gameplay no YouTube ou o jogo aberto. A análise CNN e Fuzzy rodará a cada 1 segundo.
            </p>
          </div>
        </div>

        {modoDemonstracao && capturaAtiva && (
          <div className="flex items-center gap-2 bg-yellowMain/10 border border-yellowMain/20 px-3 py-1.5 rounded-lg text-yellowMain text-xs font-mono">
            <AlertCircle size={14} />
            <span>MOCK ACADÊMICO ATIVADO (API INDISPONÍVEL)</span>
          </div>
        )}
      </div>

      {/* Grade da Inferência em Tempo Real */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Card 1: Fonte de Captura */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center justify-between uppercase tracking-wider border-b border-borderColor pb-4">
            <span>Fonte de Captura</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              capturaAtiva ? 'bg-greenMain/10 text-greenMain border border-greenMain/20' : 'bg-redMain/10 text-redMain border border-redMain/20'
            }`}>
              {capturaAtiva ? "ATIVA" : "INATIVA"}
            </span>
          </h3>

          {/* Área de Visualização do Stream */}
          <div className="border border-borderColor/40 bg-bgMain/40 aspect-video rounded-lg relative flex flex-col items-center justify-center overflow-hidden scanline-effect corner-deco">
            {/* HUD Target crosshairs */}
            <div className="absolute top-3 right-3 text-[7px] font-mono text-chiralBlue/50 uppercase tracking-widest pointer-events-none select-none z-20">
              REC // 1.0x
            </div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-8 pointer-events-none select-none z-20">
              <span className="w-4 h-0.5 bg-chiralBlue/20" />
              <span className="w-1 h-1 rounded-full bg-chiralBlue/30" />
              <span className="w-4 h-0.5 bg-chiralBlue/20" />
            </div>
            
            {capturaAtiva ? (
              <>
                <video 
                  ref={(el) => {
                    if (el && videoRef.current && el.srcObject !== videoRef.current.srcObject) {
                      el.srcObject = videoRef.current.srcObject;
                      el.play().catch(() => {});
                    }
                  }}
                  className="w-full h-full object-cover relative z-10" 
                  muted 
                  playsInline 
                />
                {/* Painel com a Visão real da IA */}
                <div className="absolute bottom-3 left-3 z-30 border border-chiralBlue/30 bg-bgMain/95 p-1.5 rounded-lg flex flex-col items-center">
                  <span className="text-[6px] font-mono text-chiralBlue uppercase block mb-1 font-bold">Visão da IA (128x128)</span>
                  <canvas ref={canvasRef} className="w-16 h-16 rounded border border-borderColor bg-black" />
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-textSecondary relative z-10">
                <Tv size={32} className="mx-auto mb-2 text-borderColor/60 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider block text-textSecondary/70">Aguardando Captura de Campo</span>
              </div>
            )}
          </div>

          {/* Dados e Estatísticas do Stream */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-bgMain/20 border border-borderColor p-2.5 rounded">
              <span className="text-[9px] text-textSecondary block uppercase">FPS Análise</span>
              <span className="text-textMain font-bold">{fpsAnalise} fps</span>
            </div>
            <div className="bg-bgMain/20 border border-borderColor p-2.5 rounded">
              <span className="text-[9px] text-textSecondary block uppercase">Resolução</span>
              <span className="text-textMain font-bold">{resolucao}</span>
            </div>
            <div className="bg-bgMain/20 border border-borderColor p-2.5 rounded">
              <span className="text-[9px] text-textSecondary block uppercase">Tempo</span>
              <span className="text-textMain font-bold">{tempoAnalise}s</span>
            </div>
            <div className="bg-bgMain/20 border border-borderColor p-2.5 rounded">
              <span className="text-[9px] text-textSecondary block uppercase">Frames</span>
              <span className="text-textMain font-bold">{framesAnalisados}</span>
            </div>
          </div>

          {/* Botões de Controle */}
          {!capturaAtiva ? (
            <button
              onClick={iniciarCaptura}
              className="w-full bg-chiralBlue hover:bg-chiralBlue/90 text-bgMain text-xs font-mono font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Play size={14} /> INICIAR CAPTURA DE TELA
            </button>
          ) : (
            <button
              onClick={pararCaptura}
              className="w-full bg-redMain hover:bg-redMain/90 text-textMain text-xs font-mono font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Square size={14} /> PARAR CAPTURA
            </button>
          )}
        </div>

        {/* Resultados das Classificações CNN (Cards 2, 3, 4) */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 lg:col-span-2 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Activity size={16} className="text-chiralBlue animate-pulse" /> Classificação Ambiental CNN (Clima, Terreno, EP)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Coluna 1: Odradek Telemetria */}
            <div className="md:col-span-1">
              <OdradekVisualizer epState={dadosInferencia?.ep_state?.dominant_class || "Desconectado"} />
            </div>
            
            {/* Card 2: Clima */}
            <div className="bg-bgMain/20 border border-borderColor p-4 rounded-lg space-y-4">
              <h4 className="text-xs font-bold font-mono text-textMain flex items-center gap-1.5 uppercase border-b border-borderColor pb-2">
                <CloudSun size={14} className="text-chiralBlue" /> Clima CNN
              </h4>
              <div className="space-y-3">
                {dadosInferencia?.weather?.probabilities ? (
                  Object.entries(dadosInferencia.weather.probabilities).map(([classe, valor]: any) => {
                    const isDom = dadosInferencia.weather.dominant_class === classe;
                    return (
                      <div key={classe} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className={isDom ? 'text-textMain font-bold' : 'text-textSecondary'}>{classe}</span>
                          <span className="font-mono font-bold text-textMain">{valor}%</span>
                        </div>
                        <div className="w-full bg-borderColor/40 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isDom ? 'bg-chiralBlue' : 'bg-textSecondary/50'}`}
                            style={{ width: `${valor}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-textSecondary py-4">Aguardando dados...</div>
                )}
              </div>
            </div>

            {/* Card 3: Terreno */}
            <div className="bg-bgMain/20 border border-borderColor p-4 rounded-lg space-y-4">
              <h4 className="text-xs font-bold font-mono text-textMain flex items-center gap-1.5 uppercase border-b border-borderColor pb-2">
                <Mountain size={14} className="text-greenMain" /> Terreno CNN
              </h4>
              <div className="space-y-3">
                {dadosInferencia?.terrain?.probabilities ? (
                  Object.entries(dadosInferencia.terrain.probabilities)
                    .sort((a: any, b: any) => b[1] - a[1]) // Ordena para exibir ranking
                    .map(([classe, valor]: any, idx) => {
                      const isDom = dadosInferencia.terrain.dominant_class === classe;
                      return (
                        <div key={classe} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className={isDom ? 'text-textMain font-bold' : 'text-textSecondary'}>
                              #{idx+1} {classe}
                            </span>
                            <span className="font-mono font-bold text-textMain">{valor}%</span>
                          </div>
                          <div className="w-full bg-borderColor/40 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isDom ? 'bg-greenMain' : 'bg-textSecondary/50'}`}
                              style={{ width: `${valor}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center text-xs text-textSecondary py-4">Aguardando dados...</div>
                )}
              </div>
            </div>

            {/* Card 4: Estado de EP */}
            <div className="bg-bgMain/20 border border-borderColor p-4 rounded-lg space-y-4">
              <h4 className="text-xs font-bold font-mono text-textMain flex items-center gap-1.5 uppercase border-b border-borderColor pb-2">
                <AlertTriangle size={14} className="text-orangeMain" /> Estado EP CNN
              </h4>
              <div className="space-y-3">
                {dadosInferencia?.ep_state?.probabilities ? (
                  Object.entries(dadosInferencia.ep_state.probabilities).map(([classe, valor]: any) => {
                    const isDom = dadosInferencia.ep_state.dominant_class === classe;
                    return (
                      <div key={classe} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className={isDom ? 'text-textMain font-bold' : 'text-textSecondary'}>{classe}</span>
                          <span className="font-mono font-bold text-textMain">{valor}%</span>
                        </div>
                        <div className="w-full bg-borderColor/40 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isDom ? 'bg-orangeMain' : 'bg-textSecondary/50'}`}
                            style={{ width: `${valor}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-textSecondary py-4">Aguardando dados...</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Grade Secundária: Dials Fuzzy, Linha de Tempo, Diagnóstico e Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Card 5 & Card 6: Resultados Fuzzy & Diagnóstico */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
              <span>Resultado Fuzzy & Diagnóstico</span>
            </h3>

            {/* Medidores Fuzzy */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {dadosInferencia?.fuzzy ? (
                <>
                  {renderDialFuzzy(
                    dadosInferencia.fuzzy.attack_risk, 
                    "Risco EP", 
                    "#EB5757", 
                    dadosInferencia.fuzzy.attack_risk > 75 ? "Crítico" : dadosInferencia.fuzzy.attack_risk > 50 ? "Alto" : dadosInferencia.fuzzy.attack_risk > 25 ? "Médio" : "Baixo"
                  )}
                  {renderDialFuzzy(
                    dadosInferencia.fuzzy.crossing_difficulty, 
                    "Travessia", 
                    "#00E5FF", 
                    dadosInferencia.fuzzy.crossing_difficulty > 75 ? "Crítico" : dadosInferencia.fuzzy.crossing_difficulty > 50 ? "Alto" : dadosInferencia.fuzzy.crossing_difficulty > 25 ? "Médio" : "Baixo"
                  )}
                  {renderDialFuzzy(
                    dadosInferencia.fuzzy.danger_level, 
                    "Perigo Geral", 
                    "#F2994A", 
                    dadosInferencia.fuzzy.label
                  )}
                </>
              ) : (
                <div className="col-span-3 text-center text-xs text-textSecondary py-10">Aguardando análise...</div>
              )}
            </div>
          </div>

          {/* Diagnóstico Inteligente */}
          {dadosInferencia && (
            <div className="mt-4 p-4 bg-bgMain border border-borderColor rounded-lg text-xs">
              <span className="text-[9px] font-mono text-textSecondary uppercase block">Diagnóstico Inteligente do Odradek:</span>
              <p className="text-textMain font-medium mt-1 leading-relaxed">{dadosInferencia.diagnosis}</p>
            </div>
          )}
        </div>

        {/* Card 7: Linha do Tempo de Eventos */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex flex-col justify-between shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Clock size={16} className="text-chiralBlue" /> Linha do Tempo de Eventos
          </h3>

          <div className="flex-1 mt-4 overflow-y-auto max-h-60 space-y-4 pr-2 font-mono text-[11px]">
            {linhaTempo.map((evt, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-chiralBlue font-bold shrink-0">{evt.horario}</span>
                <span className="text-textSecondary/40 shrink-0">|</span>
                <span className="text-textMain">{evt.mensagem}</span>
              </div>
            ))}
            {linhaTempo.length === 0 && (
              <div className="text-center text-xs text-textSecondary py-16">Nenhum evento registrado.</div>
            )}
          </div>
        </div>

        {/* Card 8: Gráficos de Evolução em Tempo Real */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex flex-col justify-between shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <TrendingUp size={16} className="text-chiralBlue" /> Evolução de Perigo
          </h3>

          <div className="h-60 mt-4">
            {historicoGrafico.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicoGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1D3038" opacity={0.3} />
                  <XAxis dataKey="tempo" stroke="#9BAAB4" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis domain={[0, 100]} stroke="#9BAAB4" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0E1820', borderColor: '#1D3038', color: '#F4F7FA' }} />
                  <Line type="monotone" dataKey="perigo" name="Nível de Perigo" stroke="#F2994A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clima_conf" name="Clima Confiança" stroke="#00E5FF" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textSecondary">
                Aguardando frames para desenhar gráfico...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
