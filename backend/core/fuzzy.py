import numpy as np

# Funções de Pertinência Matemáticas para as Variáveis Fuzzy

def pert_baixo(x):
    """Retorna o grau de pertinência para o conjunto 'Baixo' [0, 100]"""
    if x <= 25:
        return 1.0
    elif x >= 50:
        return 0.0
    else:
        return (50.0 - x) / 25.0

def pert_medio(x):
    """Retorna o grau de pertinência para o conjunto 'Médio' [0, 100]"""
    if x <= 20 or x >= 80:
        return 0.0
    elif 20 < x <= 50:
        return (x - 20.0) / 30.0
    else:
        return (80.0 - x) / 30.0

def pert_alto(x):
    """Retorna o grau de pertinência para o conjunto 'Alto' [0, 100]"""
    if x <= 50:
        return 0.0
    elif x >= 80:
        return 1.0
    else:
        return (x - 50.0) / 30.0

def pert_critico(x):
    """Retorna o grau de pertinência para o conjunto 'Crítico' [0, 100]"""
    if x <= 70:
        return 0.0
    elif x >= 95:
        return 1.0
    else:
        return (x - 70.0) / 25.0

def calcular_sistema_fuzzy(
    chuva_prob,
    ep_proxima_prob,
    combate_prob,
    terreno_prob,  # Dicionário de probabilidades dos terrenos
    ep_state_prob, # Dicionário de probabilidades dos estados de EP
    clima_prob     # Dicionário de probabilidades dos climas
):
    """
    Executa a inferência fuzzy com base nas probabilidades enviadas pela CNN.
    Mapeia os tipos de terreno e climas para valores quantitativos de entrada fuzzy.
    
    Retorna:
        dict: Valores defuzzificados para Risco de Ataque EP, Dificuldade de Travessia e Nível Geral de Perigo.
    """
    
    # 1. Obter valores das classes dominantes para facilitação
    clima_dominante = max(clima_prob, key=clima_prob.get)
    terreno_dominante = max(terreno_prob, key=terreno_prob.get)
    ep_dominante = max(ep_state_prob, key=ep_state_prob.get)
    
    # 2. Mapeamento de Terreno -> Dificuldade Intrínseca (0 a 100)
    # Campo / Vegetação: Fácil (15)
    # Área urbana / instalações: Muito Fácil (10)
    # Rochoso: Moderado (45)
    # Rio / Lago: Difícil (65)
    # Montanhoso: Muito Difícil (85)
    # Nevado: Extremo (95)
    dificuldades_terreno = {
        "Campo / Vegetação": 15,
        "Área urbana / instalações": 10,
        "Rochoso": 45,
        "Rio / Lago": 65,
        "Montanhoso": 85,
        "Nevado": 95
    }
    
    # Dificuldade do terreno baseada na ponderação das probabilidades
    dif_terreno_ponderada = sum(terreno_prob.get(t, 0) * dificuldades_terreno.get(t, 20) for t in terrenos_disponiveis()) / 100.0
    
    # 3. Mapeamento de Clima -> Perigo Ambiental (0 a 100)
    # Ensolarado: 10
    # Neblina: 50
    # Chuva / Timefall: 75
    # Neve: 85
    perigos_clima = {
        "Ensolarado": 10,
        "Neblina": 50,
        "Chuva / Timefall": 75,
        "Neve": 85
    }
    perigo_clima_ponderado = sum(clima_prob.get(c, 0) * perigos_clima.get(c, 10) for c in climas_disponiveis()) / 100.0

    # 4. Avaliação das Regras Fuzzy e Implicação (Método dos Centroides / Altura Fuzzy)
    # Definimos centroides das classes de saída:
    # Baixo = 15, Médio = 45, Alto = 75, Crítico = 95
    c_baixo, c_medio, c_alto, c_critico = 15.0, 45.0, 75.0, 95.0
    
    # --- RISCO DE ATAQUE EP ---
    # R1: Se chuva/timefall é alta e EP próxima é alta, então risco é crítico.
    r1 = min(pert_alto(chuva_prob), pert_alto(ep_proxima_prob))
    
    # R2: Se combate é alto, então risco é crítico.
    r2 = pert_alto(combate_prob)
    
    # R5: Se exploração normal é alta e EP próxima é baixa, então risco é baixo.
    normal_prob = ep_state_prob.get("Exploração normal", 0)
    r5 = min(pert_alto(normal_prob), pert_baixo(ep_proxima_prob))
    
    # Risco de ataque padrão com base na proximidade de EP
    r_normal_ep = pert_medio(ep_proxima_prob) # Ativa risco médio se EP próxima é média
    
    # Ponderação do Risco de Ataque
    # Graus de ativação de cada classe de saída
    g_critico_ataque = max(r1, r2, pert_alto(ep_state_prob.get("Boss EP", 0)))
    g_alto_ataque = max(pert_alto(ep_proxima_prob), pert_alto(ep_state_prob.get("Área de EP", 0)))
    g_medio_ataque = max(r_normal_ep, pert_medio(ep_state_prob.get("Área de EP", 0)))
    g_baixo_ataque = max(r5, pert_baixo(ep_proxima_prob) * 0.8)
    
    # Garantir pelo menos uma ativação mínima
    soma_graus_ataque = g_baixo_ataque + g_medio_ataque + g_alto_ataque + g_critico_ataque
    if soma_graus_ataque > 0:
        risco_ataque = (g_baixo_ataque * c_baixo + g_medio_ataque * c_medio + g_alto_ataque * c_alto + g_critico_ataque * c_critico) / soma_graus_ataque
    else:
        risco_ataque = 15.0 # Padrão baixo

    # --- DIFICULDADE DE TRAVESSIA ---
    # R3: Se terreno é montanhoso e clima é neve, então dificuldade é alta.
    # Montanhoso probabilidade, neve probabilidade
    montanhoso_prob = terreno_prob.get("Montanhoso", 0)
    neve_prob = clima_prob.get("Neve", 0)
    r3 = min(pert_alto(montanhoso_prob), pert_alto(neve_prob))
    
    # Dificuldade do Terreno em si ativa classes:
    # Terreno Nevado ou Montanhoso alto -> Dificuldade crítica/alta
    # Terreno Rio/Lago alto -> Dificuldade alta/média
    g_critico_trav = max(r3, pert_alto(terreno_prob.get("Nevado", 0)))
    g_alto_trav = max(pert_alto(montanhoso_prob), pert_alto(terreno_prob.get("Rio / Lago", 0)) * 0.9, r3)
    g_medio_trav = max(pert_medio(dif_terreno_ponderada), pert_alto(terreno_prob.get("Rochoso", 0)))
    g_baixo_trav = pert_baixo(dif_terreno_ponderada)
    
    soma_graus_trav = g_baixo_trav + g_medio_trav + g_alto_trav + g_critico_trav
    if soma_graus_trav > 0:
        dificuldade_travessia = (g_baixo_trav * c_baixo + g_medio_trav * c_medio + g_alto_trav * c_alto + g_critico_trav * c_critico) / soma_graus_trav
    else:
        dificuldade_travessia = 20.0

    # --- NÍVEL GERAL DE PERIGO ---
    # R4: Se terreno é rio/lago e clima é chuva, então perigo é alto.
    rio_lago_prob = terreno_prob.get("Rio / Lago", 0)
    r4 = min(pert_alto(rio_lago_prob), pert_alto(chuva_prob))
    
    # R6: Se boss EP é alto, então perigo é crítico.
    r6 = pert_alto(ep_state_prob.get("Boss EP", 0))
    
    # Perigo geral combina risco de ataque, dificuldade de travessia e condições climáticas
    g_critico_perigo = max(r6, min(pert_alto(risco_ataque), pert_alto(dificuldade_travessia)))
    g_alto_perigo = max(r4, min(pert_alto(risco_ataque), pert_medio(dificuldade_travessia)), min(pert_medio(risco_ataque), pert_alto(dificuldade_travessia)))
    g_medio_perigo = max(pert_medio(perigo_clima_ponderado), pert_medio(risco_ataque))
    g_baixo_perigo = min(pert_baixo(risco_ataque), pert_baixo(dificuldade_travessia))
    
    soma_graus_perigo = g_baixo_perigo + g_medio_perigo + g_alto_perigo + g_critico_perigo
    if soma_graus_perigo > 0:
        perigo_geral = (g_baixo_perigo * c_baixo + g_medio_perigo * c_medio + g_alto_perigo * c_alto + g_critico_perigo * c_critico) / soma_graus_perigo
    else:
        perigo_geral = 15.0

    # Arredondar para inteiros
    risco_ataque = int(np.clip(risco_ataque, 0, 100))
    dificuldade_travessia = int(np.clip(dificuldade_travessia, 0, 100))
    perigo_geral = int(np.clip(perigo_geral, 0, 100))
    
    # Classificar o rótulo do perigo geral
    if perigo_geral <= 25:
        label = "Baixo"
    elif perigo_geral <= 50:
        label = "Médio"
    elif perigo_geral <= 75:
        label = "Alto"
    else:
        label = "Crítico"
        
    # 5. Diagnóstico Inteligente baseado nos resultados
    diagnostico = gerar_diagnostico(
        clima_dominante, terreno_dominante, ep_dominante, 
        risco_ataque, dificuldade_travessia, perigo_geral
    )
        
    return {
        "attack_risk": risco_ataque,
        "crossing_difficulty": dificuldade_travessia,
        "danger_level": perigo_geral,
        "label": label,
        "diagnosis": diagnostico
    }

def terrenos_disponiveis():
    return ["Campo / Vegetação", "Rochoso", "Montanhoso", "Nevado", "Rio / Lago", "Área urbana / instalações"]

def climas_disponiveis():
    return ["Ensolarado", "Chuva / Timefall", "Neve", "Neblina"]

def gerar_diagnostico(clima, terreno, ep_state, risco, diff, perigo):
    """Gera uma frase descritiva baseada nos dados classificados e nos resultados fuzzy"""
    # Casos críticos de combate/boss
    if ep_state == "Boss EP":
        return "PRESENÇA DE BOSS EP DETECTADA. Evacue a área imediatamente ou prepare-se para combate de alta escala!"
    elif ep_state == "Combate EP":
        return "Combate ativo com entidade EP. Cuidado com o nível de sangue (HP) e use armas de hemográvida."
    
    # Casos de exploração normais
    diagnosticos = []
    
    # Analisar clima
    if clima == "Chuva / Timefall":
        diagnosticos.append("Chuva/Timefall ativa acelerando a deterioração da carga.")
    elif clima == "Neve":
        diagnosticos.append("Tempestade de neve ativa diminuindo drásticamente a resistência.")
    elif clima == "Neblina":
        diagnosticos.append("Neblina densa detectada limitando a visibilidade do scanner Odradek.")
        
    # Analisar terreno
    if terreno == "Montanhoso":
        diagnosticos.append("Terreno montanhoso com inclinações severas detectado.")
    elif terreno == "Rio / Lago":
        diagnosticos.append("Correnteza profunda à frente, risco de perda de equilíbrio.")
    elif terreno == "Nevado":
        diagnosticos.append("Superfície com neve profunda, movimentação severamente lenta.")
        
    # Analisar EPs
    if ep_state == "EP próxima":
        diagnosticos.append("Odradek apontando atividade de EP próxima. Fique abaixado e segure a respiração.")
    elif ep_state == "Área de EP":
        diagnosticos.append("Entrando em território com presença passiva de EPs. Mantenha cautela.")
        
    # Se não houver nada crítico
    if not diagnosticos:
        return "Condições estáveis de exploração. Clima limpo e sem leituras de perigo no Odradek."
    
    # Unir em um texto legível
    conclusao = " ".join(diagnosticos)
    if perigo > 75:
        conclusao += " Situação geral CRÍTICA."
    elif perigo > 50:
        conclusao += " Nível de perigo elevado."
    else:
        conclusao += " Risco moderado."
        
    return conclusao
