
from ultralytics import YOLO

print("Loading pretrained YOLO11n model...")

model = YOLO("yolo11n.pt")

print("Starting SEEVIX pothole detection training...")

results = model.train(
    data="dataset/pothole_detection_ready/data.yaml",

    epochs=60,
    imgsz=640,
    batch=4,

    patience=15,
    device="cpu",
    workers=0,

    project="runs/detect/seevix_runs",
    name="pothole_improved",

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
print("runs/detect/seevix_runs/pothole_improved/weights/best.pt")
