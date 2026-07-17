import os
import glob
import numpy as np
from PIL import Image

def calcular_ahash(caminho_imagem, hash_size=8):
    """
    Calcula o Average Hash (aHash) de uma imagem usando PIL e NumPy.
    aHash é rápido e eficiente para detectar imagens idênticas ou muito semelhantes.
    """
    try:
        with Image.open(caminho_imagem) as img:
            # Converter para escala de cinza e redimensionar para um tamanho pequeno (ex: 8x8)
            img_cinza = img.convert('L').resize((hash_size, hash_size), Image.Resampling.LANCZOS)
            pixels = np.array(img_cinza)
            # Calcular a média dos valores dos pixels
            media = pixels.mean()
            # Retornar uma matriz booleana (True se o pixel for maior que a média)
            return pixels > media
    except Exception as e:
        print(f"Erro ao processar {caminho_imagem}: {e}")
        return None

def limpar_duplicados(diretorio_dataset, max_copias=3, limiar_diferenca=4, dry_run=True):
    """
    Varre o dataset e remove imagens muito semelhantes, garantindo que no máximo
    `max_copias` de imagens semelhantes sejam mantidas por classe.
    
    :param diretorio_dataset: Caminho para a pasta raiz do dataset
    :param max_copias: Número máximo de imagens semelhantes que queremos manter
    :param limiar_diferenca: Quantidade de pixels diferentes (0 a 64 para hash 8x8) para considerar semelhante
    :param dry_run: Se True, apenas simula a remoção das imagens sem deletá-las fisicamente
    """
    print(f"Iniciando limpeza no dataset em: {diretorio_dataset}")
    if dry_run:
        print("⚠️ MODO SIMULAÇÃO (DRY RUN): Nenhuma imagem será excluída de verdade. ⚠️")
    print(f"Configurações: Máximo de cópias = {max_copias}, Limiar de diferença = {limiar_diferenca} bits\n")
    
    total_mantidas = 0
    total_excluidas = 0
    
    # Varre cada classe separadamente para não cruzar dados de classes diferentes
    subpastas_classes = []
    for root, dirs, files in os.walk(diretorio_dataset):
        # Se a pasta contém arquivos de imagem e não tem subpastas, é uma pasta de classe
        if files and any(f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) for f in files):
            subpastas_classes.append(root)
            
    if not subpastas_classes:
        print("Nenhuma pasta contendo imagens foi encontrada!")
        return

    for pasta_classe in subpastas_classes:
        classe_relativa = os.path.relpath(pasta_classe, diretorio_dataset)
        print(f"Analisando classe: {classe_relativa}...")
        
        # Encontra imagens nesta pasta específica
        extensoes = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.JPEG', '*.PNG', '*.WEBP']
        arquivos_imagem = []
        for ext in extensoes:
            arquivos_imagem.extend(glob.glob(os.path.join(pasta_classe, ext)))
            
        # Ordena as imagens por nome/data de modificação (ajuda se forem frames sequenciais de vídeo)
        arquivos_imagem = sorted(list(set(arquivos_imagem)))
        
        # Estrutura para agrupar imagens semelhantes nesta classe
        # Lista de dicionários: [{"hash": array_do_hash, "caminhos": [caminho1, caminho2]}]
        grupos_classe = []
        
        classe_mantidas = 0
        classe_excluidas = 0
        
        for caminho in arquivos_imagem:
            hash_atual = calcular_ahash(caminho)
            if hash_atual is None:
                continue
                
            encontrou_grupo = False
            
            # Comparar com os grupos já existentes nesta classe
            for grupo in grupos_classe:
                distancia = np.count_nonzero(hash_atual != grupo["hash"])
                
                # Se a diferença for menor ou igual ao limiar, são imagens semelhantes
                if distancia <= limiar_diferenca:
                    encontrou_grupo = True
                    if len(grupo["caminhos"]) < max_copias:
                        grupo["caminhos"].append(caminho)
                        classe_mantidas += 1
                    else:
                        # Exclui ou simula exclusão
                        if dry_run:
                            classe_excluidas += 1
                        else:
                            try:
                                os.remove(caminho)
                                classe_excluidas += 1
                            except Exception as e:
                                print(f"Erro ao excluir {caminho}: {e}")
                    break
            
            # Se não for semelhante a nenhum grupo existente, cria um grupo novo
            if not encontrou_grupo:
                grupos_classe.append({"hash": hash_atual, "caminhos": [caminho]})
                classe_mantidas += 1
                
        print(f"  -> Mantidas: {classe_mantidas} | {'Simuladas para exclusão' if dry_run else 'Excluídas'}: {classe_excluidas}")
        total_mantidas += classe_mantidas
        total_excluidas += classe_excluidas
        
    print("\n" + "="*40)
    print("RESUMO DA LIMPEZA:")
    print(f"Total de imagens mantidas: {total_mantidas}")
    print(f"Total de imagens {'que seriam excluídas' if dry_run else 'excluídas'}: {total_excluidas}")
    print("="*40)

if __name__ == "__main__":
    import sys
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATASET_DIR = os.path.join(BASE_DIR, "data", "dataset")
    
    # Executa em dry run por padrão para segurança.
    # Pode passar `--run` como argumento para executar a exclusão real.
    dry_run = True
    if len(sys.argv) > 1 and sys.argv[1] == "--run":
        dry_run = False
        
    limpar_duplicados(DATASET_DIR, max_copias=3, limiar_diferenca=4, dry_run=dry_run)
