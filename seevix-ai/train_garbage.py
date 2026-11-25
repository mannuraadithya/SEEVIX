
from ultralytics import YOLO

print("Loading pretrained YOLO11n model...")

model = YOLO("yolo11n.pt")

print("Starting SEEVIX Garbage and Sanitation training...")

results = model.train(
    data="Garbage_and_Sanitation_Dataset/data.yaml",

    epochs=15,
    imgsz=640,
    batch=4,

    patience=10,
    device="cpu",
    workers=0,

    project="runs/detect/seevix_runs",
    name="garbage_sanitation_v1",

    exist_ok=False,
    pretrained=True,
    optimizer="auto",

    seed=42,
    deterministic=True,
    plots=True,
    cache=False
)

print("\nTraining completed!")
print("Best model:")
print("runs/detect/seevix_runs/garbage_sanitation_v1/weights/best.pt")
