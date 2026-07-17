import os
import torch
from PIL import Image
from core.cnn import DSEnvironmentCNN, TORCH_AVAILABLE, transformadores_imagem

def test_model():
    if not TORCH_AVAILABLE:
        print("Error: PyTorch not available.")
        return

    MODEL_PATH = "data/models/modelo_cnn.pth"
    DATASET_DIR = "data/dataset"

    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file {MODEL_PATH} not found.")
        return

    device = "mps" if (hasattr(torch, "backends") and hasattr(torch.backends, "mps") and torch.backends.mps.is_available()) else "cpu"
    print(f"Loading model from {MODEL_PATH} on {device}...")
    
    modelo = DSEnvironmentCNN().to(device)
    try:
        # Usar o nosso carregador adaptativo robusto
        state_dict = torch.load(MODEL_PATH, map_location=device)
        model_dict = modelo.state_dict()
        
        # Adaptar clima_head se houver mismatch de dimensões (de 4 para 3 classes)
        if "clima_head.weight" in state_dict and state_dict["clima_head.weight"].shape != model_dict["clima_head.weight"].shape:
            print("Adaptando clima_head de 4 para 3 classes...")
            state_dict["clima_head.weight"] = state_dict["clima_head.weight"][:3, :]
            state_dict["clima_head.bias"] = state_dict["clima_head.bias"][:3]
            
        matching_state_dict = {}
        for k, v in state_dict.items():
            if k in model_dict and v.shape == model_dict[k].shape:
                matching_state_dict[k] = v
        model_dict.update(matching_state_dict)
        modelo.load_state_dict(model_dict)
        print("Modelo carregado com sucesso!")
    except Exception as e:
        print(f"Erro ao carregar modelo: {e}")
        return

    modelo.eval()

    grupos = {
        "climate": ["sunny", "rain", "snow"],
        "terrain": ["vegetation", "rocky", "mountainous", "snowy", "water", "urban"],
        "ep_state": ["normal", "ep_area", "ep_near", "ep_combat", "ep_boss"]
    }

    correct = { "climate": 0, "terrain": 0, "ep_state": 0 }
    total = { "climate": 0, "terrain": 0, "ep_state": 0 }

    for grupo, subpastas in grupos.items():
        for subpasta in subpastas:
            subpasta_path = os.path.join(DATASET_DIR, grupo, subpasta)
            if not os.path.exists(subpasta_path):
                continue
            
            for file in os.listdir(subpasta_path):
                if not file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    continue
                
                caminho_img = os.path.join(subpasta_path, file)
                try:
                    with Image.open(caminho_img) as img:
                        tensor_img = transformadores_imagem(img.convert("RGB")).unsqueeze(0).to(device)
                    
                    with torch.no_grad():
                        out_clima, out_terreno, out_ep = modelo(tensor_img)
                        
                    if grupo == "climate":
                        target = grupos["climate"].index(subpasta)
                        pred = out_clima.argmax(dim=1).item()
                        if pred == target:
                            correct["climate"] += 1
                        total["climate"] += 1
                    elif grupo == "terrain":
                        target = grupos["terrain"].index(subpasta)
                        pred = out_terreno.argmax(dim=1).item()
                        if pred == target:
                            correct["terrain"] += 1
                        total["terrain"] += 1
                    elif grupo == "ep_state":
                        target = grupos["ep_state"].index(subpasta)
                        pred = out_ep.argmax(dim=1).item()
                        if pred == target:
                            correct["ep_state"] += 1
                        total["ep_state"] += 1
                except Exception as e:
                    pass

    print("\n--- Acurácia no Dataset de Treino ---")
    for k in total:
        acc = (correct[k] / total[k] * 100) if total[k] > 0 else 0
        print(f"{k.capitalize()}: {correct[k]}/{total[k]} ({acc:.2f}%)")

if __name__ == "__main__":
    test_model()
