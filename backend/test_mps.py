import torch
import torch.nn as nn
import time

print("PyTorch Version:", torch.__version__)
print("MPS Available:", hasattr(torch, "backends") and hasattr(torch.backends, "mps") and torch.backends.mps.is_available())
print("CUDA Available:", torch.cuda.is_available())

# Test model forward/backward on device
device = "mps" if (hasattr(torch, "backends") and hasattr(torch.backends, "mps") and torch.backends.mps.is_available()) else "cpu"
print("Using device:", device)

x = torch.randn(16, 3, 128, 128).to(device)
conv = nn.Conv2d(3, 16, 3, padding=1).to(device)
bn = nn.BatchNorm2d(16).to(device)
pool = nn.MaxPool2d(2, 2).to(device)
fc = nn.Linear(16 * 64 * 64, 256).to(device)

t0 = time.time()
for _ in range(50):
    out = pool(bn(conv(x)))
    out = out.view(out.size(0), -1)
    out = fc(out)
    loss = out.sum()
    loss.backward()
print("50 iterations took:", time.time() - t0, "seconds")
