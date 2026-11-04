
from ultralytics import YOLO

# Load YOLO11 nano model
model = YOLO("yolo11n.pt")

# Dataset configuration
data_yaml = (
    "dataset/streetlight_detection/"
    "Street Lights.v1-seevix-streetlight-v1.yolov8/data.yaml"
)

# Train the streetlight detector
results = model.train(
    data=data_yaml,
    epochs=10,
    imgsz=640,
    batch=4,
    device="cpu",
    workers=2,
    patience=15,
    project="runs/detect/seevix_runs",
    name="streetlight_yolo11n",
    exist_ok=False,
    plots=True,
    save=True
)

print("\nStreetlight model training completed!")
