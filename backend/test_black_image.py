import torch
from PIL import Image
from core.cnn import DSEnvironmentCNN, TORCH_AVAILABLE, transformadores_imagem

def test_black():
    if not TORCH_AVAILABLE:
        print("PyTorch not available")
        return
        
    MODEL_PATH = "data/models/modelo_cnn.pth"
    device = "cpu"
    modelo = DSEnvironmentCNN().to(device)
    state_dict = torch.load(MODEL_PATH, map_location=device)
    model_dict = modelo.state_dict()
    if "clima_head.weight" in state_dict and state_dict["clima_head.weight"].shape != model_dict["clima_head.weight"].shape:
        state_dict["clima_head.weight"] = state_dict["clima_head.weight"][:3, :]
        state_dict["clima_head.bias"] = state_dict["clima_head.bias"][:3]
    model_dict.update({k: v for k, v in state_dict.items() if k in model_dict and v.shape == model_dict[k].shape})
    modelo.load_state_dict(model_dict)
    modelo.eval()
    
    # Criar uma imagem completamente preta (128x128)
    img_preta = Image.new("RGB", (128, 128), color=0)
    tensor_img = transformadores_imagem(img_preta).unsqueeze(0).to(device)
    
    with torch.no_grad():
        out_clima, out_terreno, out_ep = modelo(tensor_img)
        
    classes_clima = ["Ensolarado", "Chuva / Timefall", "Neve"]
    classes_terreno = ["Campo / Vegetação", "Rochoso", "Montanhoso", "Nevado", "Rio / Lago", "Área urbana / instalações"]
    classes_ep = ["Exploração normal", "Área de EP", "EP próxima", "Combate EP", "Boss EP"]
    
    pred_c = classes_clima[out_clima.argmax(dim=1).item()]
    pred_t = classes_terreno[out_terreno.argmax(dim=1).item()]
    pred_e = classes_ep[out_ep.argmax(dim=1).item()]
    
    print("Previsão para imagem PRETA:")
    print(f"Clima: {pred_c} (logits: {out_clima.tolist()})")
    print(f"Terreno: {pred_t} (logits: {out_terreno.tolist()})")
    print(f"EP: {pred_e} (logits: {out_ep.tolist()})")

if __name__ == "__main__":
    test_black()
