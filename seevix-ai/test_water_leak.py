
from ultralytics import YOLO

# Load trained Water Leakage model
model = YOLO(
    "runs/detect/runs/detect/seevix_runs/"
    "waterleak_yolo11n-4/weights/best.pt"
)

# Test image
image_path = "water_leak_test.jpg"

# Run prediction
results = model.predict(
    source=image_path,
    conf=0.05,
    save=True
)

print("\nWater leakage detection completed!")
