import io
import base64
import time
from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect, Depends, HTTPException
from PIL import Image
from typing import Dict, Any

from core.cnn import classificar_imagem
from core.fuzzy import calcular_sistema_fuzzy
from api.model import obter_treinador

router = APIRouter(prefix="/inference", tags=["Inference"])

# Nome das classes correspondentes às posições de saída do modelo CNN
CLASSES_CLIMA = ["Ensolarado", "Chuva / Timefall", "Neve"]
CLASSES_TERRENO = ["Campo / Vegetação", "Rochoso", "Montanhoso", "Nevado", "Rio / Lago", "Área urbana / instalações"]
CLASSES_EP = ["Exploração normal", "Área de EP", "EP próxima", "Combate EP", "Boss EP"]

def gerar_resposta_inferencia(prob_clima, prob_terreno, prob_ep, num_frame=0, timestamp_str="00:00") -> Dict[str, Any]:
    """
    Monta a resposta de inferência a partir de probabilidades brutas e executa a Lógica Fuzzy.
    """
    # Montar dicionários de probabilidades com rótulos amigáveis
    dict_clima = {CLASSES_CLIMA[i]: int(prob_clima[i] * 100) for i in range(len(CLASSES_CLIMA))}
    dict_terreno = {CLASSES_TERRENO[i]: int(prob_terreno[i] * 100) for i in range(len(CLASSES_TERRENO))}
    dict_ep = {CLASSES_EP[i]: int(prob_ep[i] * 100) for i in range(len(CLASSES_EP))}
    
    # Encontrar classes dominantes
    clima_dominante = max(dict_clima, key=dict_clima.get)
    terreno_dominante = max(dict_terreno, key=dict_terreno.get)
    ep_dominante = max(dict_ep, key=dict_ep.get)
    
    # 2. Executar Sistema Fuzzy
    # Usamos os valores de probabilidade como entradas fuzzy
    chuva_prob = dict_clima.get("Chuva / Timefall", 0)
    ep_proxima_prob = dict_ep.get("EP próxima", 0)
    combate_prob = dict_ep.get("Combate EP", 0)
    
    resultado_fuzzy = calcular_sistema_fuzzy(
        chuva_prob=chuva_prob,
        ep_proxima_prob=ep_proxima_prob,
        combate_prob=combate_prob,
        terreno_prob=dict_terreno,
        ep_state_prob=dict_ep,
        clima_prob=dict_clima
    )
    
    # 3. Estruturar Resposta Final
    return {
        "timestamp": timestamp_str,
        "frame_number": num_frame,
        "weather": {
            "dominant_class": clima_dominante,
            "confidence": dict_clima[clima_dominante],
            "probabilities": dict_clima
        },
        "terrain": {
            "dominant_class": terreno_dominante,
            "confidence": dict_terreno[terreno_dominante],
            "probabilities": dict_terreno
        },
        "ep_state": {
            "dominant_class": ep_dominante,
            "confidence": dict_ep[ep_dominante],
            "probabilities": dict_ep
        },
        "fuzzy": {
            "attack_risk": resultado_fuzzy["attack_risk"],
            "crossing_difficulty": resultado_fuzzy["crossing_difficulty"],
            "danger_level": resultado_fuzzy["danger_level"],
            "label": resultado_fuzzy["label"]
        },
        "diagnosis": resultado_fuzzy["diagnosis"]
    }

def processar_e_analisar_imagem(imagem_pil, treinador, num_frame=0, timestamp_str="00:00") -> Dict[str, Any]:
    """
    Executa a imagem pela CNN e depois roda o sistema Fuzzy.
    Garante o retorno no formato JSON exato especificado.
    """
    # 1. Classificação CNN
    resultado_cnn = classificar_imagem(treinador.modelo, imagem_pil, device=treinador.device)
    
    prob_clima = resultado_cnn["clima"]
    prob_terreno = resultado_cnn["terreno"]
    prob_ep = resultado_cnn["ep"]
    
    return gerar_resposta_inferencia(prob_clima, prob_terreno, prob_ep, num_frame, timestamp_str)

@router.post("/frame")
def analisar_frame_unico(
    file: UploadFile = File(...),
    treinador = Depends(obter_treinador)
):
    """
    Recebe um frame único de imagem via HTTP POST, realiza a análise CNN + Fuzzy.
    """
    try:
        dados_imagem = file.file.read()
        imagem_pil = Image.open(io.BytesIO(dados_imagem)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido.")
        
    timestamp_formatado = time.strftime("%M:%S", time.gmtime(time.time()))
    return processar_e_analisar_imagem(imagem_pil, treinador, num_frame=1, timestamp_str=timestamp_formatado)

@router.websocket("/live")
async def websocket_analise_live(websocket: WebSocket, treinador = Depends(obter_treinador)):
    """
    WebSocket para inferência de gameplay em tempo real.
    Recebe frames codificados em base64 e envia a resposta de inferência.
    """
    await websocket.accept()
    frame_count = 0
    tempo_inicio = time.time()
    
    # Históricos para filtro temporal (suavização de 4 frames)
    historico_clima = []
    historico_terreno = []
    historico_ep = []
    WINDOW_SIZE = 4
    
    try:
        while True:
            # Recebe dados do frontend
            dados = await websocket.receive_text()
            
            # Formato esperado: string base64 pura ou prefixada com data:image/...
            if "," in dados:
                dados = dados.split(",")[1]
                
            try:
                dados_binarios = base64.b64decode(dados)
                imagem_pil = Image.open(io.BytesIO(dados_binarios)).convert("RGB")
            except Exception as e:
                await websocket.send_json({"error": "Dados de imagem inválidos ou base64 incorreto."})
                continue
                
            frame_count += 1
            tempo_decorrido = time.time() - tempo_inicio
            minutos = int(tempo_decorrido // 60)
            segundos = int(tempo_decorrido % 60)
            timestamp_str = f"{minutos:02d}:{segundos:02d}"
            
            # 1. Obter probabilidades brutas da CNN
            from core.cnn import classificar_imagem
            resultado_cnn = classificar_imagem(treinador.modelo, imagem_pil, device=treinador.device)
            
            prob_clima = resultado_cnn["clima"]
            prob_terreno = resultado_cnn["terreno"]
            prob_ep = resultado_cnn["ep"]
            
            # 2. Atualizar históricos do filtro temporal
            historico_clima.append(prob_clima)
            historico_terreno.append(prob_terreno)
            historico_ep.append(prob_ep)
            
            if len(historico_clima) > WINDOW_SIZE:
                historico_clima.pop(0)
            if len(historico_terreno) > WINDOW_SIZE:
                historico_terreno.pop(0)
            if len(historico_ep) > WINDOW_SIZE:
                historico_ep.pop(0)
                
            # 3. Calcular médias das probabilidades no sliding window
            avg_clima = [sum(col) / len(col) for col in zip(*historico_clima)]
            avg_terreno = [sum(col) / len(col) for col in zip(*historico_terreno)]
            avg_ep = [sum(col) / len(col) for col in zip(*historico_ep)]
            
            # 4. Gerar resposta final baseada nas probabilidades suavizadas
            resposta = gerar_resposta_inferencia(
                avg_clima, 
                avg_terreno, 
                avg_ep, 
                num_frame=frame_count, 
                timestamp_str=timestamp_str
            )
            
            # Enviar de volta ao cliente
            await websocket.send_json(resposta)
            
    except WebSocketDisconnect:
        print("WebSocket de inferência ao vivo desconectado.")
    except Exception as e:
        print(f"Erro no WebSocket de inferência: {e}")
