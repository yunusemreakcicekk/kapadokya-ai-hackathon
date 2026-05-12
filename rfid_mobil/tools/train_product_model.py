from pathlib import Path
import os

import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torch.utils.mobile_optimizer import optimize_for_mobile
from torchvision import datasets, models, transforms


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "training_data"
MODEL_OUT = ROOT / "assets" / "models" / "hackathon_model.ptl"
LABELS_OUT = ROOT / "assets" / "models" / "labels.txt"
CLASSES = ["Comlek", "Hali", "Kilim", "Seramik Tabak", "Vazo"]


def build_model(num_classes: int) -> nn.Module:
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(1280, 128),
        nn.ReLU(),
        nn.Linear(128, num_classes),
    )
    return model


def main() -> None:
    os.chdir(ROOT)

    for class_name in CLASSES:
        class_dir = DATA_DIR / class_name
        class_dir.mkdir(parents=True, exist_ok=True)

    transform = transforms.Compose(
        [
            transforms.Resize((256, 256)),
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(
                brightness=0.25,
                contrast=0.25,
                saturation=0.20,
            ),
            transforms.RandomRotation(12),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )

    dataset = datasets.ImageFolder(DATA_DIR, transform=transform)
    if len(dataset) < len(CLASSES) * 10:
        raise RuntimeError(
            "Yeterli veri yok. Her kategori icin en az 10, ideal olarak "
            "30-50 telefon fotografi ekleyin."
        )

    if dataset.classes != CLASSES:
        raise RuntimeError(
            f"Klasor sirasi beklenenden farkli: {dataset.classes}. "
            f"Beklenen: {CLASSES}"
        )

    val_size = max(len(CLASSES), int(len(dataset) * 0.2))
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = random_split(
        dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=16)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(len(CLASSES)).to(device)

    for param in model.features.parameters():
        param.requires_grad = False

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=0.001)

    best_accuracy = 0.0
    best_state = None

    for epoch in range(12):
        model.train()
        train_loss = 0.0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                outputs = model(images)
                predicted = outputs.argmax(dim=1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        accuracy = correct / total if total else 0
        print(
            f"Epoch {epoch + 1:02d} | "
            f"loss={train_loss / max(len(train_loader), 1):.4f} | "
            f"val_acc={accuracy:.3f}"
        )

        if accuracy >= best_accuracy:
            best_accuracy = accuracy
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is not None:
        model.load_state_dict(best_state)

    model.eval().cpu()
    traced = torch.jit.trace(model, torch.rand(1, 3, 224, 224))
    optimized = optimize_for_mobile(traced)
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    optimized._save_for_lite_interpreter("assets/models/hackathon_model.ptl")
    LABELS_OUT.write_text("\n".join(CLASSES), encoding="utf-8")

    print(f"Model kaydedildi: {MODEL_OUT}")
    print(f"Etiketler kaydedildi: {LABELS_OUT}")
    print(f"En iyi dogrulama basarimi: {best_accuracy:.3f}")


if __name__ == "__main__":
    main()
