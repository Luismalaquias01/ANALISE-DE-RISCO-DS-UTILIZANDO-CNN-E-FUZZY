import { useState, useEffect } from 'react';
import { Binary, Sliders, CheckSquare } from 'lucide-react';

export default function FuzzySystem() {
  // Entradas Fuzzy Controláveis
  const [chuva, setChuva] = useState(75);
  const [epProx, setEpProx] = useState(80);
  const [combate, setCombate] = useState(10);
  const [dificuldadeTerreno, setDificuldadeTerreno] = useState(85);
  const [perigoAmbiental, setPerigoAmbiental] = useState(70);

  // Saídas Fuzzy Calculadas
  const [riscoAtaque, setRiscoAtaque] = useState(0);
  const [dificuldadeTrav, setDificuldadeTrav] = useState(0);
  const [perigoGeral, setPerigoGeral] = useState(0);

  // Pertinências do Sistema
  const pertBaixo = (x: number) => x <= 25 ? 1 : x >= 50 ? 0 : (50 - x) / 25;
  const pertMedio = (x: number) => (x <= 20 || x >= 80) ? 0 : x <= 50 ? (x - 20) / 30 : (80 - x) / 30;
  const pertAlto = (x: number) => x <= 50 ? 0 : x >= 80 ? 1 : (x - 50) / 30;
  const pertCritico = (x: number) => x <= 70 ? 0 : x >= 95 ? 1 : (x - 70) / 25;

  // recalcular saídas fuzzy localmente usando a mesma lógica do backend
  useEffect(() => {
    // Centroides das saídas
    const cBaixo = 15, cMedio = 45, cAlto = 75, cCritico = 95;

    // --- RISCO DE ATAQUE EP ---
    const r1 = Math.min(pertAlto(chuva), pertAlto(epProx)); // Chuva alta + EP próxima alta -> Risco crítico
    const r2 = pertAlto(combate); // Combate alto -> Risco crítico
    const r5 = Math.min(pertAlto(100 - epProx), pertBaixo(epProx)); // Exploração normal/EP próxima baixo -> Risco baixo
    const rNormal = pertMedio(epProx); // EP próxima médio -> Risco médio

    const gCriticoAtaque = Math.max(r1, r2, pertAlto(combate * 1.2));
    const gAltoAtaque = Math.max(pertAlto(epProx), r1);
    const gMedioAtaque = Math.max(rNormal, pertMedio(epProx));
    const gBaixoAtaque = Math.max(r5, pertBaixo(epProx) * 0.8);

    const somaAtaque = gCriticoAtaque + gAltoAtaque + gMedioAtaque + gBaixoAtaque;
    const calcRisco = somaAtaque > 0 
      ? (gBaixoAtaque * cBaixo + gMedioAtaque * cMedio + gAltoAtaque * cAlto + gCriticoAtaque * cCritico) / somaAtaque
      : 15;

    // --- DIFICULDADE DE TRAVESSIA ---
    const r3 = Math.min(pertAlto(dificuldadeTerreno), pertAlto(chuva)); // Montanhoso + Neve/Chuva -> Travessia alta
    const gCriticoTrav = Math.max(r3, pertCritico(dificuldadeTerreno));
    const gAltoTrav = Math.max(pertAlto(dificuldadeTerreno), r3);
    const gMedioTrav = pertMedio(dificuldadeTerreno);
    const gBaixoTrav = pertBaixo(dificuldadeTerreno);

    const somaTrav = gCriticoTrav + gAltoTrav + gMedioTrav + gBaixoTrav;
    const calcTrav = somaTrav > 0
      ? (gBaixoTrav * cBaixo + gMedioTrav * cMedio + gAltoTrav * cAlto + gCriticoTrav * cCritico) / somaTrav
      : 15;

    // --- PERIGO GERAL ---
    const r4 = Math.min(pertAlto(dificuldadeTerreno), pertAlto(chuva)); // Rio/Lago + Chuva -> Perigo alto
    const r6 = pertCritico(combate); // Boss/Combate crítico -> Perigo crítico

    const gCriticoPerigo = Math.max(r6, Math.min(pertAlto(calcRisco), pertAlto(calcTrav)));
    const gAltoPerigo = Math.max(r4, Math.min(pertAlto(calcRisco), pertMedio(calcTrav)));
    const gMedioPerigo = Math.max(pertMedio(perigoAmbiental), pertMedio(calcRisco));
    const gBaixoPerigo = Math.min(pertBaixo(calcRisco), pertBaixo(calcTrav));

    const somaPerigo = gCriticoPerigo + gAltoPerigo + gMedioPerigo + gBaixoPerigo;
    const calcPerigo = somaPerigo > 0
      ? (gBaixoPerigo * cBaixo + gMedioPerigo * cMedio + gAltoPerigo * cAlto + gCriticoPerigo * cCritico) / somaPerigo
      : 15;

    setRiscoAtaque(Math.round(calcRisco));
    setDificuldadeTrav(Math.round(calcTrav));
    setPerigoGeral(Math.round(calcPerigo));
  }, [chuva, epProx, combate, dificuldadeTerreno, perigoAmbiental]);

  // Regras e seus estados de ativação
  const regras = [
    { id: 1, texto: "Se Chuva/Timefall é Alta e EP Próxima é Alta, então Risco de Ataque é Crítico.", ativo: pertAlto(chuva) > 0.2 && pertAlto(epProx) > 0.2 },
    { id: 2, texto: "Se Combate é Alto, então Risco de Ataque é Crítico.", ativo: pertAlto(combate) > 0.2 },
    { id: 3, texto: "Se Terreno é Montanhoso e Clima é Neve, então Dificuldade de Travessia é Alta.", ativo: pertAlto(dificuldadeTerreno) > 0.2 && pertAlto(chuva) > 0.2 },
    { id: 4, texto: "Se Terreno é Rio/Lago e Clima é Chuva, então Perigo Geral é Alto.", ativo: pertAlto(dificuldadeTerreno) > 0.3 && pertAlto(chuva) > 0.3 },
    { id: 5, texto: "Se Exploração é Normal e EP Próxima é Baixa, então Risco de Ataque é Baixo.", ativo: pertBaixo(epProx) > 0.5 },
    { id: 6, texto: "Se Boss EP é Alto, então Perigo Geral é Crítico.", ativo: pertCritico(combate) > 0.4 },
  ];

  // Renderizador de Medidores Circulares
  const renderMedidorCircular = (valor: number, titulo: string, cor: string) => {
    const raio = 46;
    const circunferencia = 2 * Math.PI * raio;
    const offset = circunferencia - (valor / 100) * circunferencia;
    
    // Obter faixa de classificação
    let faixa = "Baixo";
    let corTexto = "text-greenMain";
    let borderHighlight = "border-borderColor hover:border-chiralBlue/30";
    let glowStyle = {};
    
    if (valor > 75) { 
      faixa = "Crítico"; 
      corTexto = "text-redMain";
      borderHighlight = "border-redMain/30 shadow-md shadow-redMain/5";
      glowStyle = { filter: "drop-shadow(0 0 5px rgba(235, 87, 87, 0.6))" };
    } else if (valor > 50) { 
      faixa = "Alto"; 
      corTexto = "text-orangeMain";
      borderHighlight = "border-orangeMain/30 shadow-md shadow-orangeMain/5";
      glowStyle = { filter: "drop-shadow(0 0 5px rgba(242, 153, 74, 0.6))" };
    } else if (valor > 25) { 
      faixa = "Médio"; 
      corTexto = "text-yellowMain";
      borderHighlight = "border-yellowMain/30 shadow-md shadow-yellowMain/5";
      glowStyle = { filter: "drop-shadow(0 0 5px rgba(242, 201, 76, 0.6))" };
    } else {
      borderHighlight = "border-chiralBlue/30 shadow-md shadow-chiralBlue/5";
      glowStyle = { filter: "drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))" };
    }

    return (
      <div className={`bg-bgCard border p-6 rounded-xl flex flex-col items-center text-center corner-deco transition-all duration-300 shadow-lg ${borderHighlight}`}>
        <span className="text-[10px] text-textSecondary uppercase font-mono font-bold tracking-wider mb-4">{titulo}</span>
        
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Anel de calibração pontilhado externo */}
          <div className="absolute w-32 h-32 rounded-full border border-dashed border-textSecondary/10 animate-spin" style={{ animationDuration: '60s' }} />
          
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fundo */}
            <circle cx="72" cy="72" r={raio} stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="rgba(11,15,20,0.5)" />
            {/* Arco principal do medidor */}
            <circle 
              cx="72" 
              cy="72" 
              r={raio} 
              stroke={cor} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              style={glowStyle}
            />
            {/* Marcadores de calibração */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((ang) => (
              <line
                key={ang}
                x1={72 + (raio - 5) * Math.cos((ang * Math.PI) / 180)}
                y1={72 + (raio - 5) * Math.sin((ang * Math.PI) / 180)}
                x2={72 + raio * Math.cos((ang * Math.PI) / 180)}
                y2={72 + raio * Math.sin((ang * Math.PI) / 180)}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold font-mono text-textMain tracking-tighter">{valor}%</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest font-mono text-blink ${corTexto}`}>{faixa}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl flex items-center gap-4 shadow-lg">
        <div className="p-3 bg-chiralBlue/10 text-chiralBlue rounded-xl border border-chiralBlue/20">
          <Binary size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono text-textMain uppercase tracking-wider">Sistema de Tomada de Decisão Fuzzy</h2>
          <p className="text-xs text-textSecondary mt-1">
            Simulador de Lógica Fuzzy de Mamdani. Modifique os controles deslizantes das variáveis linguísticas para analisar a defuzzificação do risco em tempo real.
          </p>
        </div>
      </div>

      {/* Grade de Controles e Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Controles de Entrada */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl space-y-6 shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain flex items-center gap-2 uppercase tracking-wider border-b border-borderColor pb-4">
            <Sliders size={16} className="text-chiralBlue" /> Variáveis de Entrada
          </h3>

          <div className="space-y-5">
            {/* Chuva */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary">Timefall (Chuva)</span>
                <span className="text-chiralBlue font-bold">{chuva}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={chuva}
                onChange={(e) => setChuva(Number(e.target.value))}
                className="w-full accent-chiralBlue bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* EPs Próximas */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary">EP Próxima</span>
                <span className="text-orangeMain font-bold">{epProx}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={epProx}
                onChange={(e) => setEpProx(Number(e.target.value))}
                className="w-full accent-orangeMain bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Combate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary">Probabilidade de Combate</span>
                <span className="text-redMain font-bold">{combate}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={combate}
                onChange={(e) => setCombate(Number(e.target.value))}
                className="w-full accent-redMain bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Dificuldade de Terreno */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary">Dificuldade do Terreno</span>
                <span className="text-greenMain font-bold">{dificuldadeTerreno}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={dificuldadeTerreno}
                onChange={(e) => setDificuldadeTerreno(Number(e.target.value))}
                className="w-full accent-greenMain bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Perigo Ambiental */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-textSecondary">Perigo Ambiental (Intensidade)</span>
                <span className="text-yellowMain font-bold">{perigoAmbiental}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={perigoAmbiental}
                onChange={(e) => setPerigoAmbiental(Number(e.target.value))}
                className="w-full accent-yellowMain bg-borderColor/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Curvas de Pertinência Fuzzy (SVG Gráfico) */}
        <div className="bg-bgCard border border-borderColor p-6 rounded-xl lg:col-span-2 flex flex-col justify-between shadow-lg">
          <h3 className="text-sm font-bold font-mono text-textMain mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Binary size={16} className="text-chiralBlue" /> Funções de Pertinência (Fuzzy Membership Functions)
          </h3>

          {/* Renderização de gráfico SVG */}
          <div className="w-full aspect-[21/9] bg-bgMain/30 border border-borderColor/60 rounded-xl relative p-4">
            <svg viewBox="0 0 400 150" className="w-full h-full">
              <defs>
                <linearGradient id="gradBaixo" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2ECC71" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradMedio" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F2C94C" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F2C94C" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradAlto" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F2994A" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F2994A" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradCritico" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EB5757" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#EB5757" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grades verticais e horizontais */}
              <line x1="40" y1="10" x2="40" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="120" y1="10" x2="120" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="200" y1="10" x2="200" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="280" y1="10" x2="280" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="360" y1="10" x2="360" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              <line x1="40" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="40" y1="10" x2="380" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4" />

              {/* Rótulos dos eixos */}
              <text x="35" y="15" fill="#9BAAB4" fontSize="8" textAnchor="end" fontFamily="monospace">1.0</text>
              <text x="35" y="132" fill="#9BAAB4" fontSize="8" textAnchor="end" fontFamily="monospace">0.0</text>
              
              <text x="40" y="142" fill="#9BAAB4" fontSize="8" textAnchor="middle" fontFamily="monospace">0</text>
              <text x="120" y="142" fill="#9BAAB4" fontSize="8" textAnchor="middle" fontFamily="monospace">25</text>
              <text x="200" y="142" fill="#9BAAB4" fontSize="8" textAnchor="middle" fontFamily="monospace">50</text>
              <text x="280" y="142" fill="#9BAAB4" fontSize="8" textAnchor="middle" fontFamily="monospace">75</text>
              <text x="360" y="142" fill="#9BAAB4" fontSize="8" textAnchor="middle" fontFamily="monospace">100</text>

              {/* Curva: Baixo */}
              <polyline
                fill="url(#gradBaixo)"
                points="40,10 120,10 200,130 40,130"
              />
              <polyline
                fill="none" stroke="#2ECC71" strokeWidth="2"
                points="40,10 120,10 200,130 380,130"
                style={{ filter: "drop-shadow(0 0 3px rgba(46, 204, 113, 0.4))" }}
              />
              <text x="80" y="25" fill="#2ECC71" fontSize="8" fontWeight="bold" fontFamily="monospace">Baixo</text>

              {/* Curva: Médio */}
              <polyline
                fill="url(#gradMedio)"
                points="104,130 200,10 296,130 104,130"
              />
              <polyline
                fill="none" stroke="#F2C94C" strokeWidth="2"
                points="40,130 104,130 200,10 296,130 380,130"
                style={{ filter: "drop-shadow(0 0 3px rgba(242, 201, 76, 0.4))" }}
              />
              <text x="200" y="25" fill="#F2C94C" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">Médio</text>

              {/* Curva: Alto */}
              <polyline
                fill="url(#gradAlto)"
                points="200,130 296,10 380,10 380,130 200,130"
              />
              <polyline
                fill="none" stroke="#F2994A" strokeWidth="2"
                points="40,130 200,130 296,10 380,10"
                style={{ filter: "drop-shadow(0 0 3px rgba(242, 153, 74, 0.4))" }}
              />
              <text x="310" y="25" fill="#F2994A" fontSize="8" fontWeight="bold" fontFamily="monospace">Alto</text>

              {/* Curva: Crítico */}
              <polyline
                fill="url(#gradCritico)"
                points="264,130 344,10 380,10 380,130 264,130"
              />
              <polyline
                fill="none" stroke="#EB5757" strokeWidth="2"
                points="40,130 264,130 344,10 380,10"
                style={{ filter: "drop-shadow(0 0 3px rgba(235, 87, 87, 0.4))" }}
              />
              <text x="350" y="45" fill="#EB5757" fontSize="8" fontWeight="bold" fontFamily="monospace">Crítico</text>
            </svg>
          </div>

          <div className="text-[10px] text-textSecondary font-mono mt-4 leading-relaxed bg-bgMain/20 border border-borderColor p-3 rounded-lg">
            <strong>Legenda das Curvas:</strong> O eixo Y expressa o grau de pertinência μ(x) ∈ [0, 1] correspondente a cada nível de probabilidade e perigos detectados nas classes CNN.
          </div>
        </div>
      </div>

      {/* Grade de Medidores de Saída Fuzzy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderMedidorCircular(riscoAtaque, "Risco de Ataque EP", "#EB5757")}
        {renderMedidorCircular(dificuldadeTrav, "Dificuldade de Travessia", "#00E5FF")}
        {renderMedidorCircular(perigoGeral, "Nível Geral de Perigo", "#F2994A")}
      </div>

      {/* Regras Ativas */}
      <div className="bg-bgCard border border-borderColor p-6 rounded-xl shadow-lg">
        <h3 className="text-sm font-bold font-mono text-textMain mb-6 flex items-center gap-2 uppercase tracking-wider">
          <CheckSquare size={16} className="text-chiralBlue" /> Avaliador de Regras Fuzzy (Inferência Ativa)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regras.map((regra) => (
            <div 
              key={regra.id} 
              className={`p-4 rounded-lg border transition-all ${
                regra.ativo 
                  ? 'bg-chiralBlue/5 border-chiralBlue/30 text-textMain' 
                  : 'bg-bgMain/20 border-borderColor/40 text-textSecondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${regra.ativo ? 'bg-chiralBlue animate-pulse' : 'bg-borderColor'}`} />
                <span className="text-xs font-mono leading-relaxed">{regra.texto}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
