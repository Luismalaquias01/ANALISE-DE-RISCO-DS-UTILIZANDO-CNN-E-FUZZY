from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/model", tags=["Model"])

# Instância do treinador configurada no main.py e injetada via dependência
# Para manter simples, a referência do treinador será mantida como variável global neste módulo ou injetada no app
# Vamos expor uma função para main.py registrar a instância do treinador.
treinador_global = None

def registrar_treinador(treinador_instancia):
    global treinador_global
    treinador_global = treinador_instancia

def obter_treinador():
    if treinador_global is None:
        raise HTTPException(status_code=500, detail="Treinador CNN não foi inicializado no backend.")
    return treinador_global

class ConfigTreino(BaseModel):
    epochs: int = 50

@router.get("/status")
def obter_status_modelo(treinador = Depends(obter_treinador)):
    """Retorna as métricas de treino em tempo real, status da thread e histórico."""
    return treinador.obter_status()

@router.post("/train/start")
def iniciar_treinamento(config: ConfigTreino, treinador = Depends(obter_treinador)):
    """Inicia o treinamento da CNN em uma thread separada."""
    try:
        treinador.iniciar(total_epochs=config.epochs)
        return {"status": "sucesso", "mensagem": f"Treinamento iniciado para {config.epochs} épocas."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train/pause")
def pausar_treinamento(treinador = Depends(obter_treinador)):
    """Pausa o treinamento em andamento."""
    treinador.pausar()
    return {"status": "sucesso", "mensagem": "Treinamento pausado."}

@router.post("/train/reset")
def resetar_treinamento(treinador = Depends(obter_treinador)):
    """Reseta totalmente o progresso do treinamento e reinicializa os pesos do modelo."""
    treinador.resetar()
    return {"status": "sucesso", "mensagem": "Modelo e progresso de treinamento resetados com sucesso."}

@router.post("/save")
def salvar_modelo(treinador = Depends(obter_treinador)):
    """Salva os pesos do modelo treinado no disco."""
    sucesso = treinador.salvar()
    if sucesso:
        return {"status": "sucesso", "mensagem": "Pesos do modelo salvos com sucesso."}
    else:
        raise HTTPException(status_code=400, detail="Não foi possível salvar o modelo (PyTorch indisponível ou erro de gravação).")

@router.post("/load")
def carregar_modelo(treinador = Depends(obter_treinador)):
    """Recarrega os pesos do modelo a partir do disco."""
    sucesso = treinador.carregar()
    if sucesso:
        return {"status": "sucesso", "mensagem": "Pesos do modelo recarregados com sucesso."}
    else:
        raise HTTPException(status_code=404, detail="Arquivo de pesos do modelo não encontrado ou PyTorch indisponível.")

@router.get("/history")
def obter_historico_treinos(treinador = Depends(obter_treinador)):
    """Retorna o histórico persistido de todas as sessões de treinamento."""
    import os
    import json
    caminho_hist = os.path.join(os.path.dirname(treinador.caminho_modelo), "historico_treinos.json")
    if os.path.exists(caminho_hist):
        try:
            with open(caminho_hist, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao ler histórico: {e}")
    return []

class CarregarSessaoRequest(BaseModel):
    id_sessao: int

@router.post("/load-session")
def carregar_sessao_treino(req: CarregarSessaoRequest, treinador = Depends(obter_treinador)):
    """Carrega as métricas, histórico e pesos de uma sessão específica do histórico."""
    sucesso = treinador.carregar_sessao_por_id(req.id_sessao)
    if sucesso:
        return {"status": "sucesso", "mensagem": f"Sessão #{req.id_sessao} carregada com sucesso."}
    else:
        raise HTTPException(status_code=400, detail="Não foi possível carregar a sessão especificada (pesos inexistentes ou ID inválido).")
