import os
import sys
import platform
import time
import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Adiciona o diretório atual ao sys.path para garantir importações corretas
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api import dataset, model, inference
from core.trainer import TreinadorCNN
from api.model import registrar_treinador
from core.cnn import TORCH_AVAILABLE

app = FastAPI(
    title="DS Environment Intelligence API",
    description="Backend acadêmico para classificação ambiental e análise de risco usando CNN e Lógica Fuzzy no Death Stranding.",
    version="1.0.0"
)

# Configuração do CORS para permitir acesso do React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção deve ser restrito, para desenvolvimento localhost "*" é ótimo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar gerenciador de treinamento
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "data", "dataset")
MODEL_PATH = os.path.join(BASE_DIR, "data", "models", "modelo_cnn.pth")

os.makedirs(os.path.join(BASE_DIR, "data", "models"), exist_ok=True)
treinador = TreinadorCNN(DATASET_DIR, MODEL_PATH)

# Registrar a instância no roteador de modelos
registrar_treinador(treinador)

# Incluir Roteadores da API
app.include_router(dataset.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(inference.router, prefix="/api")

# Servir imagens do dataset como arquivos estáticos para exibição no frontend
from fastapi.staticfiles import StaticFiles
app.mount("/dataset", StaticFiles(directory=DATASET_DIR), name="dataset")

# Servir imagens removidas de backup
REMOVED_DIR = os.path.join(BASE_DIR, "data", "removed_images")
os.makedirs(REMOVED_DIR, exist_ok=True)
app.mount("/removed_images", StaticFiles(directory=REMOVED_DIR), name="removed_images")

@app.get("/")
def home():
    return {
        "sistema": "DS Environment Intelligence",
        "status": "online",
        "mensagem": "API Python rodando e aguardando conexões.",
        "versao": "1.0.0"
    }

@app.get("/api/system/health")
def obter_saude_sistema():
    """Retorna o status de hardware e da IA para o cabeçalho do Frontend."""
    # Obter média de uso de CPU do SO (macOS suporta os.getloadavg)
    cpu_usage = 0.0
    try:
        if hasattr(os, "getloadavg"):
            # os.getloadavg retorna uma tupla com a carga nos últimos 1, 5 e 15 minutos
            # Usamos a média de 1 minuto dividida pelo número de CPUs estimadas (ou apenas a carga direta)
            load = os.getloadavg()[0]
            cpu_usage = min(99.0, round(load * 10, 1)) # Escala aproximada para visualização
        else:
            cpu_usage = 12.5 # Valor mock de fallback seguro
    except Exception:
        cpu_usage = 15.0

    # Obter status da GPU usando PyTorch se disponível
    gpu_nome = "Nenhum (Somente CPU)"
    gpu_memoria = 0
    gpu_disponivel = False
    
    if TORCH_AVAILABLE:
        import torch
        if torch.cuda.is_available():
            gpu_disponivel = True
            gpu_nome = torch.cuda.get_device_name(0)
        elif hasattr(torch, "backends") and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            gpu_disponivel = True
            gpu_nome = "Apple Silicon GPU (MPS)"
            
    # Obter tamanho do dataset
    total_imagens = 0
    if os.path.exists(DATASET_DIR):
        for root, dirs, files in os.walk(DATASET_DIR):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    total_imagens += 1

    return {
        "status_api": "online",
        "modelo_treinado": os.path.exists(MODEL_PATH),
        "torch_disponivel": TORCH_AVAILABLE,
        "sistema_operacional": platform.system(),
        "processador": platform.processor() or "Apple Silicon",
        "cpu_uso_porcentagem": cpu_usage if cpu_usage > 0 else 5.0,
        "gpu": {
            "disponivel": gpu_disponivel,
            "nome": gpu_nome
        },
        "dataset_total_imagens": total_imagens,
        "treino_status": treinador.status,
        "epoch_atual": treinador.epoch_atual,
        "accuracy_atual": round(treinador.accuracy, 4) if not (math.isnan(treinador.accuracy) or math.isinf(treinador.accuracy)) else 0.0,
        "loss_atual": round(treinador.loss, 4) if not (math.isnan(treinador.loss) or math.isinf(treinador.loss)) else 1.0,
        "timestamp_atual": int(time.time())
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
