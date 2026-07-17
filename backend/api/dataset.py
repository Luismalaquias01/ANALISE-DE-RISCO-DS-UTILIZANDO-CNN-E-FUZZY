import os
import shutil
import time
import random
import glob
import numpy as np
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Dict, List

router = APIRouter(prefix="/dataset", tags=["Dataset"])

# Caminhos base
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "data", "dataset")
REMOVED_DIR = os.path.join(BASE_DIR, "data", "removed_images")

# Mapeamentos internos das classes
MAPA_CLASSES = {
    "climate": {
        "sunny": "Ensolarado",
        "rain": "Chuva / Timefall",
        "snow": "Neve"
    },
    "terrain": {
        "vegetation": "Campo / Vegetação",
        "rocky": "Rochoso",
        "mountainous": "Montanhoso",
        "snowy": "Nevado",
        "water": "Rio / Lago",
        "urban": "Área urbana / instalações"
    },
    "ep_state": {
        "normal": "Exploração normal",
        "ep_area": "Área de EP",
        "ep_near": "EP próxima",
        "ep_combat": "Combate EP",
        "ep_boss": "Boss EP"
    }
}

# Inicializa a estrutura de pastas caso não exista
def inicializar_diretorios():
    os.makedirs(DATASET_DIR, exist_ok=True)
    for grupo, classes in MAPA_CLASSES.items():
        grupo_dir = os.path.join(DATASET_DIR, grupo)
        os.makedirs(grupo_dir, exist_ok=True)
        for class_key in classes.keys():
            os.makedirs(os.path.join(grupo_dir, class_key), exist_ok=True)

inicializar_diretorios()

@router.get("/stats")
def obter_informacoes_dataset():
    """Retorna os dados estatísticos do dataset organizado em Clima, Terreno e Estado EP"""
    inicializar_diretorios()
    
    resposta = {
        "total_images": 0,
        "groups": {
            "Clima": [],
            "Terreno": [],
            "Estado EP": []
        }
    }
    
    # Dicionário de tradução dos nomes dos grupos
    traducao_grupos = {
        "climate": "Clima",
        "terrain": "Terreno",
        "ep_state": "Estado EP"
    }
    
    total_geral = 0
    contagem_por_grupo = {"climate": 0, "terrain": 0, "ep_state": 0}
    detalhes_classes = {}
    
    # Primeiro conta os arquivos para calcular as proporções
    for grupo_key, classes in MAPA_CLASSES.items():
        grupo_dir = os.path.join(DATASET_DIR, grupo_key)
        detalhes_classes[grupo_key] = {}
        
        for class_key, class_name in classes.items():
            classe_dir = os.path.join(grupo_dir, class_key)
            if os.path.exists(classe_dir):
                arquivos = [f for f in os.listdir(classe_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
                qtd = len(arquivos)
            else:
                qtd = 0
            
            detalhes_classes[grupo_key][class_key] = qtd
            contagem_por_grupo[grupo_key] += qtd
            total_geral += qtd

    resposta["total_images"] = total_geral
    
    # Constrói o retorno detalhado com balanço e porcentagens
    for grupo_key, classes in MAPA_CLASSES.items():
        nome_grupo = traducao_grupos[grupo_key]
        total_grupo = contagem_por_grupo[grupo_key]
        
        for class_key, class_name in classes.items():
            qtd = detalhes_classes[grupo_key][class_key]
            
            # Cálculo de porcentagem dentro do grupo correspondente
            porcentagem = round((qtd / total_grupo * 100), 1) if total_grupo > 0 else 0.0
            
            # Avaliação de balanceamento
            # Numa distribuição ideal uniforme:
            # Clima (4 classes) = 25% cada. Terreno (6 classes) = 16.7% cada. EP State (5 classes) = 20% cada.
            ideal = 100.0 / len(classes)
            status_bal = "Neutro"
            if total_grupo > 10:
                if porcentagem < ideal * 0.6:
                    status_bal = "Insuficiente"
                elif porcentagem > ideal * 1.5:
                    status_bal = "Sobrecarregado"
                else:
                    status_bal = "Balanceado"
            elif total_grupo > 0:
                status_bal = "Poucos dados"
            else:
                status_bal = "Vazio"
                
            # Coleta miniaturas (nomes de arquivos locais para renderizar)
            classe_dir = os.path.join(DATASET_DIR, grupo_key, class_key)
            miniaturas = []
            if os.path.exists(classe_dir):
                arquivos = sorted([f for f in os.listdir(classe_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
                # Retornamos os nomes de até 5 imagens
                miniaturas = arquivos[:5]
                
            resposta["groups"][nome_grupo].append({
                "class_id": class_key,
                "name": class_name,
                "count": qtd,
                "percentage": porcentagem,
                "balance_status": status_bal,
                "thumbnails": miniaturas
            })
            
    return resposta

@router.post("/upload")
def fazer_upload_imagem(
    grupo: str = Form(...),  # climate, terrain, ep_state
    classe: str = Form(...),  # sunny, rain, etc.
    file: UploadFile = File(...)
):
    """Realiza o upload de uma imagem para uma pasta específica do dataset"""
    if grupo not in MAPA_CLASSES or classe not in MAPA_CLASSES[grupo]:
        raise HTTPException(status_code=400, detail="Grupo ou classe inválidos.")
        
    inicializar_diretorios()
    
    # Validar extensão do arquivo
    extensao = os.path.splitext(file.filename)[1].lower()
    if extensao not in ['.png', '.jpg', '.jpeg', '.webp']:
        raise HTTPException(status_code=400, detail="Apenas imagens PNG, JPG ou WEBP são suportadas.")
        
    caminho_destino = os.path.join(DATASET_DIR, grupo, classe, f"{int(time.time())}_{random.randint(1000, 9999)}{extensao}")
    
    try:
        with open(caminho_destino, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "sucesso", "filename": os.path.basename(caminho_destino)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")


# --- SISTEMA DE DETECÇÃO E LIMPEZA DE IMAGENS SEMELHANTES/DUPLICADAS ---

def calcular_ahash(caminho_imagem, hash_size=8):
    """Calcula o Average Hash (aHash) de uma imagem usando PIL e NumPy."""
    try:
        with Image.open(caminho_imagem) as img:
            img_cinza = img.convert('L').resize((hash_size, hash_size), Image.Resampling.LANCZOS)
            pixels = np.array(img_cinza)
            media = pixels.mean()
            return pixels > media
    except Exception as e:
        print(f"Erro ao calcular hash de {caminho_imagem}: {e}")
        return None

def obter_grupos_semelhantes(grupo: str, classe: str, max_copias: int = 4, limiar_diferenca: int = 4):
    pasta_classe = os.path.join(DATASET_DIR, grupo, classe)
    if not os.path.exists(pasta_classe):
        raise HTTPException(status_code=404, detail="Classe não encontrada no dataset.")
        
    extensoes = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']
    arquivos_imagem = []
    for ext in extensoes:
        arquivos_imagem.extend(glob.glob(os.path.join(pasta_classe, ext)))
        
    arquivos_imagem = sorted(list(set(arquivos_imagem)))
    
    grupos_classe = []
    total_imagens = len(arquivos_imagem)
    total_mantidas = 0
    total_duplicadas = 0
    
    for caminho in arquivos_imagem:
        hash_atual = calcular_ahash(caminho)
        if hash_atual is None:
            continue
            
        encontrou_grupo = False
        nome_arquivo = os.path.basename(caminho)
        
        for g in grupos_classe:
            distancia = np.count_nonzero(hash_atual != g["hash"])
            if distancia <= limiar_diferenca:
                encontrou_grupo = True
                if len(g["kept"]) < max_copias:
                    g["kept"].append(nome_arquivo)
                    total_mantidas += 1
                else:
                    g["duplicates"].append(nome_arquivo)
                    total_duplicadas += 1
                break
                
        if not encontrou_grupo:
            grupos_classe.append({
                "hash": hash_atual,
                "kept": [nome_arquivo],
                "duplicates": []
            })
            total_mantidas += 1
            
    # Filtra e formata para o retorno (apenas grupos com duplicados reais para simplificar exibição)
    grupos_resposta = []
    for idx, g in enumerate(grupos_classe):
        if g["duplicates"]:
            grupos_resposta.append({
                "grupo_id": idx,
                "kept": g["kept"],
                "duplicates": g["duplicates"]
            })
            
    return {
        "total_imagens": total_imagens,
        "total_mantidas": total_mantidas,
        "total_duplicadas": total_duplicadas,
        "grupos": grupos_resposta
    }

@router.get("/duplicates/analyze")
def analisar_duplicados(
    grupo: str,
    classe: str,
    max_copias: int = 4,
    limiar: int = 4
):
    """Analisa imagens da classe em busca de duplicatas/semelhantes sem excluí-las."""
    if grupo not in MAPA_CLASSES or classe not in MAPA_CLASSES[grupo]:
        raise HTTPException(status_code=400, detail="Grupo ou classe inválidos.")
    return obter_grupos_semelhantes(grupo, classe, max_copias, limiar)

@router.post("/duplicates/clean")
def limpar_duplicados_api(
    grupo: str = Form(...),
    classe: str = Form(...),
    max_copias: int = Form(4),
    limiar: int = Form(4)
):
    """Move imagens duplicadas excedentes para a pasta de backup."""
    if grupo not in MAPA_CLASSES or classe not in MAPA_CLASSES[grupo]:
        raise HTTPException(status_code=400, detail="Grupo ou classe inválidos.")
        
    resultado = obter_grupos_semelhantes(grupo, classe, max_copias, limiar)
    
    pasta_origem = os.path.join(DATASET_DIR, grupo, classe)
    pasta_destino = os.path.join(REMOVED_DIR, grupo, classe)
    os.makedirs(pasta_destino, exist_ok=True)
    
    movidos = 0
    for g in resultado["grupos"]:
        for dup in g["duplicates"]:
            caminho_origem = os.path.join(pasta_origem, dup)
            caminho_destino = os.path.join(pasta_destino, dup)
            if os.path.exists(caminho_origem):
                try:
                    shutil.move(caminho_origem, caminho_destino)
                    movidos += 1
                except Exception as e:
                    print(f"Erro ao mover {dup} para backup: {e}")
                    
    return {
        "status": "sucesso",
        "total_movidas": movidos,
        "pasta_backup": f"backend/data/removed_images/{grupo}/{classe}"
    }

@router.get("/duplicates/backup")
def obter_backup_duplicados(grupo: str, classe: str):
    """Lista as imagens atualmente salvas no backup da classe informada."""
    if grupo not in MAPA_CLASSES or classe not in MAPA_CLASSES[grupo]:
        raise HTTPException(status_code=400, detail="Grupo ou classe inválidos.")
        
    pasta_backup = os.path.join(REMOVED_DIR, grupo, classe)
    if not os.path.exists(pasta_backup):
        return {"total_backup": 0, "imagens": []}
        
    arquivos = sorted([f for f in os.listdir(pasta_backup) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])
    return {
        "total_backup": len(arquivos),
        "imagens": arquivos
    }

@router.post("/duplicates/restore")
def restaurar_backup(
    grupo: str = Form(...),
    classe: str = Form(...),
    filename: str = Form("all")
):
    """Restaura imagens do backup de volta para o dataset ativo."""
    if grupo not in MAPA_CLASSES or classe not in MAPA_CLASSES[grupo]:
        raise HTTPException(status_code=400, detail="Grupo ou classe inválidos.")
        
    pasta_backup = os.path.join(REMOVED_DIR, grupo, classe)
    pasta_destino = os.path.join(DATASET_DIR, grupo, classe)
    os.makedirs(pasta_destino, exist_ok=True)
    
    if not os.path.exists(pasta_backup):
        raise HTTPException(status_code=404, detail="Não há imagens de backup para esta classe.")
        
    restaurados = 0
    if filename == "all":
        arquivos = [f for f in os.listdir(pasta_backup) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        for f in arquivos:
            caminho_origem = os.path.join(pasta_backup, f)
            caminho_destino = os.path.join(pasta_destino, f)
            try:
                shutil.move(caminho_origem, caminho_destino)
                restaurados += 1
            except Exception as e:
                print(f"Erro ao restaurar {f}: {e}")
    else:
        caminho_origem = os.path.join(pasta_backup, filename)
        caminho_destino = os.path.join(pasta_destino, filename)
        if not os.path.exists(caminho_origem):
            raise HTTPException(status_code=404, detail="Arquivo de backup específico não encontrado.")
        try:
            shutil.move(caminho_origem, caminho_destino)
            restaurados += 1
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao restaurar arquivo: {str(e)}")
            
    return {
        "status": "sucesso",
        "total_restauradas": restaurados
    }
