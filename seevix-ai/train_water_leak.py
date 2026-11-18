
from ultralytics import YOLO

# Load YOLO11 nano model
model = YOLO("yolo11n.pt")

# Water leakage dataset configuration
data_yaml = (
    "water_leakage_dataset/"
    "data.yaml"
)

results = model.train(
    data=data_yaml,
    epochs=10,
    imgsz=640,
    batch=4,
    device="cpu",
    workers=2,
    patience=15,
    project="runs/detect/seevix_runs",
    name="waterleak_yolo11n",
    exist_ok=False,
    plots=True,
    save=True
)

print("\nWater leakage model training completed!")
